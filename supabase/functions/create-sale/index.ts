import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS - restrict to known domains
const ALLOWED_ORIGINS = [
  "https://id-preview--e2305a67-dd71-4dc6-bb28-50ab8384c9ab.lovable.app",
  "https://yesclin.com",
  "https://www.yesclin.com",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

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
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client for user auth validation
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client for transaction operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Usuário não autenticado");
    }

    // Get user's clinic
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("clinic_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.clinic_id) {
      throw new Error("Clínica não encontrada");
    }

    const clinicId = profile.clinic_id;
    const input: CreateSaleInput = await req.json();

    // Validate input
    if (!input.items || input.items.length === 0) {
      throw new Error("A venda deve ter pelo menos um item");
    }

    // Get clinic settings
    const { data: clinic } = await serviceClient
      .from("clinics")
      .select("allow_negative_stock")
      .eq("id", clinicId)
      .single();

    const allowNegative = input.allowNegativeStock ?? clinic?.allow_negative_stock ?? false;

    // Validate stock for all items BEFORE starting transaction
    const stockErrors: string[] = [];
    const productsData: Map<string, { stock_quantity: number; cost_price: number; name: string }> = new Map();

    for (const item of input.items) {
      const { data: product, error: productError } = await serviceClient
        .from("products")
        .select("id, name, stock_quantity, cost_price")
        .eq("id", item.product_id)
        .eq("clinic_id", clinicId)
        .single();

      if (productError || !product) {
        throw new Error(`Produto não encontrado: ${item.product_name}`);
      }

      const currentStock = Number(product.stock_quantity) || 0;
      productsData.set(product.id, {
        stock_quantity: currentStock,
        cost_price: Number(product.cost_price) || 0,
        name: product.name,
      });

      if (item.quantity > currentStock && !allowNegative) {
        stockErrors.push(
          `${product.name}: solicitado ${item.quantity}, disponível ${currentStock}`
        );
      }
    }

    if (stockErrors.length > 0) {
      throw new Error(`Estoque insuficiente: ${stockErrors.join("; ")}`);
    }

    // Calculate totals
    const subtotal = input.items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    const discountAmount =
      input.discount_amount ||
      (input.discount_percent ? subtotal * (input.discount_percent / 100) : 0);

    const totalAmount = subtotal - discountAmount;

    // Generate sale number
    const saleNumber = `V${Date.now().toString(36).toUpperCase()}`;

    // ============================================
    // START TRANSACTION - All operations in sequence
    // If any fails, we manually rollback
    // ============================================

    let saleId: string | null = null;
    let transactionId: string | null = null;
    const createdMovementIds: string[] = [];

    try {
      // STEP 1: Create sale record
      const { data: sale, error: saleError } = await serviceClient
        .from("sales")
        .insert({
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
        })
        .select("id")
        .single();

      if (saleError) {
        throw new Error(`Erro ao criar venda: ${saleError.message}`);
      }

      saleId = sale.id;

      // STEP 2: Create sale_items records with cost and margin calculations
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
          profit: profit,
          margin_percent: marginPercent,
          notes: item.notes || null,
        };
      });

      const { error: itemsError } = await serviceClient
        .from("sale_items")
        .insert(saleItems);

      if (itemsError) {
        throw new Error(`Erro ao criar itens da venda: ${itemsError.message}`);
      }

      // STEP 3: Create finance_transactions record (type = entrada/income)
      if (totalAmount > 0) {
        const transactionDate = input.sale_date 
          ? input.sale_date.split("T")[0] 
          : new Date().toISOString().split("T")[0];

        const { data: transaction, error: transactionError } = await serviceClient
          .from("finance_transactions")
          .insert({
            clinic_id: clinicId,
            type: "entrada", // INCOME
            description: `Venda ${saleNumber}`,
            amount: totalAmount,
            transaction_date: transactionDate,
            payment_method: input.payment_method || null,
            patient_id: input.patient_id || null,
            professional_id: input.professional_id || null,
            origin: "venda", // SALE reference
            created_by: user.id,
          })
          .select("id")
          .single();

        if (transactionError) {
          throw new Error(`Erro ao criar transação financeira: ${transactionError.message}`);
        }

        transactionId = transaction.id;

        // Link transaction to sale
        await serviceClient
          .from("sales")
          .update({ transaction_id: transactionId })
          .eq("id", saleId);
      }

      // STEP 4 & 5: Create stock_movements and update products
      for (const item of input.items) {
        const productData = productsData.get(item.product_id)!;
        const previousQty = productData.stock_quantity;
        const newQty = previousQty - item.quantity;

        // Create stock movement (type = venda/OUT)
        const { data: movement, error: movementError } = await serviceClient
          .from("stock_movements")
          .insert({
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
            notes: `Venda ${saleNumber}`,
            created_by: user.id,
          })
          .select("id")
          .single();

        if (movementError) {
          throw new Error(`Erro ao criar movimento de estoque: ${movementError.message}`);
        }

        createdMovementIds.push(movement.id);

        // Update product stock
        const { error: stockError } = await serviceClient
          .from("products")
          .update({
            stock_quantity: newQty,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.product_id);

        if (stockError) {
          throw new Error(`Erro ao atualizar estoque: ${stockError.message}`);
        }

        // Update cached stock for subsequent iterations
        productData.stock_quantity = newQty;
      }

      // STEP 6: Log audit entry for sale creation
      await serviceClient
        .from("access_logs")
        .insert({
          clinic_id: clinicId,
          user_id: user.id,
          action: "SALE_CREATED",
          resource: `sales/${saleId}`,
          ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
          user_agent: req.headers.get("user-agent") || null,
        });

      // SUCCESS - Return the created sale
      return new Response(
        JSON.stringify({
          success: true,
          sale: {
            id: saleId,
            sale_number: saleNumber,
            total_amount: totalAmount,
            transaction_id: transactionId,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (innerError) {
      // ============================================
      // ROLLBACK - Clean up any created records
      // ============================================
      console.error("Transaction failed, rolling back:", innerError);

      // Rollback stock movements
      if (createdMovementIds.length > 0) {
        await serviceClient
          .from("stock_movements")
          .delete()
          .in("id", createdMovementIds);
      }

      // Rollback finance transaction
      if (transactionId) {
        await serviceClient
          .from("finance_transactions")
          .delete()
          .eq("id", transactionId);
      }

      // Rollback sale items and sale (cascade should handle items)
      if (saleId) {
        await serviceClient.from("sale_items").delete().eq("sale_id", saleId);
        await serviceClient.from("sales").delete().eq("id", saleId);
      }

      // Restore product stock quantities
      for (const item of input.items) {
        const productData = productsData.get(item.product_id);
        if (productData) {
          await serviceClient
            .from("products")
            .update({ stock_quantity: productData.stock_quantity })
            .eq("id", item.product_id);
        }
      }

      throw innerError;
    }
  } catch (error) {
    console.error("Error in create-sale:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
