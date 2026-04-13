import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SaleItemInput {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  notes?: string;
}

interface CreateSaleInput {
  patient_id?: string;
  professional_id?: string;
  appointment_id?: string;
  sale_date?: string;
  discount_amount?: number;
  discount_percent?: number;
  payment_method?: string;
  payment_status?: string;
  notes?: string;
  items: SaleItemInput[];
  allowNegativeStock?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error("Usuário não autenticado");

    const { data: profile, error: profileError } = await serviceClient
      .from("profiles").select("clinic_id").eq("user_id", user.id).single();
    if (profileError || !profile?.clinic_id) throw new Error("Clínica não encontrada");

    const clinicId = profile.clinic_id;
    const input: CreateSaleInput = await req.json();

    if (!input.items || input.items.length === 0) {
      throw new Error("A venda deve ter pelo menos um item");
    }

    // Get clinic settings
    const { data: clinic } = await serviceClient
      .from("clinics").select("allow_negative_stock").eq("id", clinicId).single();
    const allowNegative = input.allowNegativeStock ?? clinic?.allow_negative_stock ?? false;

    // Validate stock for all items
    const stockErrors: string[] = [];
    const productsData: Map<string, { stock_quantity: number; cost_price: number; name: string }> = new Map();
    const inventoryItemsData: Map<string, { id: string; controls_batch: boolean; default_cost_price: number }> = new Map();

    for (const item of input.items) {
      const { data: product } = await serviceClient
        .from("products").select("id, name, stock_quantity, cost_price")
        .eq("id", item.product_id).eq("clinic_id", clinicId).maybeSingle();

      if (product) {
        const currentStock = Number(product.stock_quantity) || 0;
        productsData.set(product.id, {
          stock_quantity: currentStock,
          cost_price: Number(product.cost_price) || 0,
          name: product.name,
        });
        if (item.quantity > currentStock && !allowNegative) {
          stockErrors.push(product.name + ": solicitado " + item.quantity + ", disponível " + currentStock);
        }
      }

      const { data: invItem } = await serviceClient
        .from("inventory_items").select("id, controls_batch, default_cost_price")
        .eq("id", item.product_id).eq("clinic_id", clinicId).maybeSingle();

      if (invItem) {
        inventoryItemsData.set(invItem.id, invItem);
      }

      if (!product && !invItem) {
        throw new Error("Produto não encontrado: " + item.product_name);
      }

      if (!product && invItem) {
        productsData.set(item.product_id, {
          stock_quantity: 999999,
          cost_price: Number(invItem.default_cost_price) || 0,
          name: item.product_name,
        });
      }
    }

    if (stockErrors.length > 0) {
      throw new Error("Estoque insuficiente: " + stockErrors.join("; "));
    }

    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const discountAmount = input.discount_amount || (input.discount_percent ? subtotal * (input.discount_percent / 100) : 0);
    const totalAmount = subtotal - discountAmount;
    const saleNumber = "V" + Date.now().toString(36).toUpperCase();

    let saleId: string | null = null;
    let transactionId: string | null = null;
    const createdMovementIds: string[] = [];
    const createdInvMovementIds: string[] = [];

    try {
      // STEP 1: Create sale
      const { data: sale, error: saleError } = await serviceClient
        .from("sales").insert({
          clinic_id: clinicId,
          sale_number: saleNumber,
          patient_id: input.patient_id || null,
          professional_id: input.professional_id || null,
          appointment_id: input.appointment_id || null,
          sale_date: input.sale_date || new Date().toISOString(),
          subtotal,
          discount_amount: discountAmount,
          discount_percent: input.discount_percent || 0,
          total_amount: totalAmount,
          payment_method: input.payment_method || null,
          payment_status: input.payment_status || "pendente",
          notes: input.notes || null,
          created_by: user.id,
        }).select("id").single();
      if (saleError) throw new Error("Erro ao criar venda: " + saleError.message);
      saleId = sale.id;

      // STEP 2: Create sale_items with cost snapshot for margin calculation
      const saleItems = input.items.map((item) => {
        const productData = productsData.get(item.product_id)!;
        const costPrice = productData.cost_price;
        const totalCost = item.quantity * costPrice;
        const totalPrice = item.quantity * item.unit_price - (item.discount_amount || 0);
        const profit = totalPrice - totalCost;
        const marginPercent = totalPrice > 0 ? (profit / totalPrice) * 100 : 0;
        return {
          clinic_id: clinicId,
          sale_id: saleId,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount || 0,
          total_price: totalPrice,
          cost_price: costPrice,
          total_cost: totalCost,
          profit,
          margin_percent: marginPercent,
          notes: item.notes || null,
        };
      });
      const { error: itemsError } = await serviceClient.from("sale_items").insert(saleItems);
      if (itemsError) throw new Error("Erro itens: " + itemsError.message);

      // STEP 3: Finance transaction (receita)
      if (totalAmount > 0) {
        const transactionDate = input.sale_date ? input.sale_date.split("T")[0] : new Date().toISOString().split("T")[0];
        const { data: transaction, error: transactionError } = await serviceClient
          .from("finance_transactions").insert({
            clinic_id: clinicId,
            type: "receita",
            description: "Venda " + saleNumber,
            amount: totalAmount,
            transaction_date: transactionDate,
            payment_method: input.payment_method || null,
            patient_id: input.patient_id || null,
            professional_id: input.professional_id || null,
            origin: "venda",
            created_by: user.id,
          }).select("id").single();
        if (transactionError) throw new Error("Erro financeira: " + transactionError.message);
        transactionId = transaction.id;
        await serviceClient.from("sales").update({ transaction_id: transactionId }).eq("id", saleId);
      }

      // STEP 4: Stock movements (legacy + new dual-write)
      for (const item of input.items) {
        const productData = productsData.get(item.product_id)!;

        // Legacy stock_movements + product stock update
        const { data: legacyProduct } = await serviceClient
          .from("products").select("id, stock_quantity").eq("id", item.product_id).maybeSingle();

        if (legacyProduct) {
          const previousQty = Number(legacyProduct.stock_quantity) || 0;
          const newQty = previousQty - item.quantity;
          const { data: movement, error: movementError } = await serviceClient
            .from("stock_movements").insert({
              clinic_id: clinicId,
              product_id: item.product_id,
              movement_type: "venda",
              quantity: item.quantity,
              previous_quantity: previousQty,
              new_quantity: newQty,
              unit_cost: productData.cost_price,
              total_cost: productData.cost_price * item.quantity,
              reason: "Venda",
              reference_type: "sale",
              reference_id: saleId,
              notes: "Venda " + saleNumber,
              created_by: user.id,
            }).select("id").single();
          if (movementError) throw new Error("Erro movimento: " + movementError.message);
          createdMovementIds.push(movement.id);
          await serviceClient.from("products")
            .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
            .eq("id", item.product_id);
          productData.stock_quantity = newQty;
        }

        // Dual-write: inventory_movements for items in inventory_items
        const invItem = inventoryItemsData.get(item.product_id);
        if (invItem) {
          const { data: invMov, error: invMovError } = await serviceClient
            .from("inventory_movements").insert({
              clinic_id: clinicId,
              item_id: item.product_id,
              batch_id: null,
              movement_type: "sale",
              quantity: item.quantity,
              unit_cost: productData.cost_price,
              total_cost: productData.cost_price * item.quantity,
              unit_sale_price: item.unit_price,
              reason: "Venda " + saleNumber,
              source_module: "sale",
              source_id: saleId,
              patient_id: input.patient_id || null,
              professional_id: input.professional_id || null,
              appointment_id: input.appointment_id || null,
              notes: "Venda " + saleNumber,
              created_by: user.id,
            }).select("id").single();
          if (invMovError) {
            console.error("Dual-write inventory_movements failed:", invMovError.message);
          } else if (invMov) {
            createdInvMovementIds.push(invMov.id);
          }
        }
      }

      // STEP 5: Audit log
      await serviceClient.from("access_logs").insert({
        clinic_id: clinicId,
        user_id: user.id,
        action: "SALE_CREATED",
        resource_type: "sale",
        resource_id: saleId,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
        user_agent: req.headers.get("user-agent") || null,
      });

      return new Response(
        JSON.stringify({
          success: true,
          sale: { id: saleId, sale_number: saleNumber, total_amount: totalAmount, transaction_id: transactionId },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    } catch (innerError) {
      console.error("Transaction failed, rolling back:", innerError);
      if (createdInvMovementIds.length > 0) {
        await serviceClient.from("inventory_movements").delete().in("id", createdInvMovementIds);
      }
      if (createdMovementIds.length > 0) {
        await serviceClient.from("stock_movements").delete().in("id", createdMovementIds);
      }
      if (transactionId) {
        await serviceClient.from("finance_transactions").delete().eq("id", transactionId);
      }
      if (saleId) {
        await serviceClient.from("sale_items").delete().eq("sale_id", saleId);
        await serviceClient.from("sales").delete().eq("id", saleId);
      }
      for (const item of input.items) {
        const productData = productsData.get(item.product_id);
        if (productData) {
          await serviceClient.from("products")
            .update({ stock_quantity: productData.stock_quantity })
            .eq("id", item.product_id);
        }
      }
      throw innerError;
    }
  } catch (error) {
    console.error("Error in create-sale:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
