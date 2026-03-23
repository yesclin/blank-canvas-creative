import { Construction } from "lucide-react";
import { motion } from "framer-motion";

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function PagePlaceholder({ title, description, icon: Icon = Construction }: PagePlaceholderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
        <Construction className="w-4 h-4" />
        <span>Em construção</span>
      </div>
    </motion.div>
  );
}
