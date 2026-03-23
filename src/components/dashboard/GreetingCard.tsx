import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import { getGreetingEmoji } from '@/hooks/useDashboardData';

interface GreetingCardProps {
  text: string;
  userName: string;
  context: string;
}

export function GreetingCard({ text, userName, context }: GreetingCardProps) {
  const hour = useMemo(() => new Date().getHours(), []);
  const emoji = getGreetingEmoji(hour);

  return (
    <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="py-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              {text}, {userName}! <span className="text-2xl">{emoji}</span>
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {context}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <div className="font-medium">
              {new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </div>
            <div>
              {new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
