 import { ScrollArea } from "@/components/ui/scroll-area";
 import { cn } from "@/lib/utils";
 import { Check } from "lucide-react";
 import { FACIAL_MUSCLES } from "./types";
 
 interface MuscleListProps {
   selectedMuscle: string | null;
   onSelectMuscle: (muscleId: string) => void;
   disabled?: boolean;
 }
 
 // Group muscles by region
 const MUSCLE_REGIONS = [
   { region: 'Testa', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Testa') },
   { region: 'Glabela', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Glabela') },
   { region: 'Periorbital', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Periorbital') },
   { region: 'Nariz', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Nariz') },
   { region: 'Bochecha', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Bochecha') },
   { region: 'Perioral', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Perioral' || m.region === 'Nariz/Boca' || m.region === 'Boca') },
   { region: 'Queixo', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Queixo') },
   { region: 'Mandíbula', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Mandíbula') },
   { region: 'Pescoço', muscles: FACIAL_MUSCLES.filter(m => m.region === 'Pescoço') },
 ].filter(group => group.muscles.length > 0);
 
 export function MuscleList({ selectedMuscle, onSelectMuscle, disabled }: MuscleListProps) {
   return (
     <ScrollArea className="h-full pr-2">
       <div className="space-y-4">
         {MUSCLE_REGIONS.map((group) => (
           <div key={group.region}>
             <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
               {group.region}
             </h4>
             <div className="space-y-1">
               {group.muscles.map((muscle) => {
                 const isSelected = selectedMuscle === muscle.id;
                 return (
                   <button
                     key={muscle.id}
                     onClick={() => onSelectMuscle(muscle.id)}
                     disabled={disabled}
                     className={cn(
                       "w-full text-left px-3 py-2.5 rounded-lg transition-all",
                       "border border-transparent",
                       "hover:bg-muted/60",
                       "disabled:opacity-50 disabled:cursor-not-allowed",
                       isSelected && "bg-primary/10 border-primary/30 hover:bg-primary/15"
                     )}
                   >
                     <div className="flex items-start gap-2">
                       <div className={cn(
                         "w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center",
                         isSelected 
                           ? "border-primary bg-primary" 
                           : "border-muted-foreground/30"
                       )}>
                         {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className={cn(
                           "font-medium text-sm leading-tight",
                           isSelected && "text-primary"
                         )}>
                           {muscle.name}
                         </p>
                         <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                           {muscle.description}
                         </p>
                       </div>
                     </div>
                   </button>
                 );
               })}
             </div>
           </div>
         ))}
       </div>
     </ScrollArea>
   );
 }