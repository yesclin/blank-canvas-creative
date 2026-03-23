 import { cn } from "@/lib/utils";
 import type { ViewType, FacialMapApplication, ProcedureType } from "./types";
 
 interface FacialMapSVGProps {
   viewType: ViewType;
   applications: FacialMapApplication[];
   selectedPointId?: string | null;
   onPointClick?: (point: FacialMapApplication) => void;
   onMapClick?: (x: number, y: number) => void;
   isEditing?: boolean;
   selectedMuscle?: string | null;
   className?: string;
 }
 
 const PROCEDURE_COLORS: Record<ProcedureType, string> = {
   toxin: '#dc2626',
   filler: '#2563eb',
   biostimulator: '#16a34a',
 };
 
 export function FacialMapSVG({
   viewType,
   applications,
   selectedPointId,
   onPointClick,
   onMapClick,
   isEditing = false,
   selectedMuscle,
   className,
 }: FacialMapSVGProps) {
   const filteredApplications = applications.filter(a => a.view_type === viewType);
 
   const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
     if (!isEditing || !onMapClick) return;
     
     const svg = e.currentTarget;
     const rect = svg.getBoundingClientRect();
     const x = ((e.clientX - rect.left) / rect.width) * 100;
     const y = ((e.clientY - rect.top) / rect.height) * 100;
     
     onMapClick(x, y);
   };
 
   return (
     <svg
       viewBox="0 0 400 520"
       className={cn(
         "w-full h-full transition-all",
         isEditing && selectedMuscle && "cursor-crosshair",
         className
       )}
       onClick={handleSvgClick}
     >
       {/* Subtle gradient background */}
       <defs>
         <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
           <stop offset="0%" stopColor="hsl(var(--background))" />
           <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.3" />
         </linearGradient>
         <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
           <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1"/>
         </filter>
       </defs>
       
       {/* Face - Frontal View */}
       {viewType === 'frontal' && (
         <g className="face-frontal" filter="url(#softShadow)">
           {/* Face oval */}
           <ellipse 
             cx="200" cy="250" rx="130" ry="170" 
             fill="url(#skinGradient)" 
             stroke="hsl(var(--border))" 
             strokeWidth="1.5" 
           />
           
           {/* Hairline */}
           <path 
             d="M 85 180 Q 100 80 200 60 Q 300 80 315 180" 
             fill="none" 
             stroke="hsl(var(--muted-foreground))" 
             strokeWidth="1"
             opacity="0.4"
           />
           
           {/* Forehead region indicator */}
           <ellipse 
             cx="200" cy="140" rx="70" ry="35"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="4 2"
             opacity="0.3"
           />
           
           {/* Eyebrows - thicker, more natural */}
           <path 
             d="M 120 175 Q 140 165 175 172" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="4" 
             strokeLinecap="round"
             opacity="0.7"
           />
           <path 
             d="M 225 172 Q 260 165 280 175" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="4" 
             strokeLinecap="round"
             opacity="0.7"
           />
           
           {/* Glabela region */}
           <path 
             d="M 178 175 Q 200 168 222 175"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="3 2"
             opacity="0.4"
           />
           
           {/* Eyes - almond shaped */}
           <ellipse cx="150" cy="200" rx="28" ry="14" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.8" />
           <ellipse cx="250" cy="200" rx="28" ry="14" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.8" />
           <circle cx="150" cy="200" r="8" fill="hsl(var(--foreground))" opacity="0.6" />
           <circle cx="250" cy="200" r="8" fill="hsl(var(--foreground))" opacity="0.6" />
           
           {/* Crow's feet regions */}
           <path 
             d="M 105 195 L 115 200 M 105 200 L 115 200 M 105 205 L 115 200"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             opacity="0.3"
           />
           <path 
             d="M 295 195 L 285 200 M 295 200 L 285 200 M 295 205 L 285 200"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             opacity="0.3"
           />
           
           {/* Nose */}
           <path 
             d="M 200 185 L 200 260 M 180 265 Q 200 280 220 265" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5" 
             opacity="0.6"
           />
           
           {/* Nasolabial fold indicators */}
           <path 
             d="M 170 260 Q 160 295 155 320"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="3 2"
             opacity="0.3"
           />
           <path 
             d="M 230 260 Q 240 295 245 320"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="3 2"
             opacity="0.3"
           />
           
           {/* Cheekbone area */}
           <ellipse 
             cx="120" cy="265" rx="30" ry="20"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="4 2"
             opacity="0.2"
           />
           <ellipse 
             cx="280" cy="265" rx="30" ry="20"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="4 2"
             opacity="0.2"
           />
           
           {/* Mouth */}
           <path 
             d="M 160 330 Q 200 348 240 330" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="2" 
             opacity="0.7"
           />
           <line 
             x1="160" y1="330" x2="240" y2="330" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5" 
             opacity="0.6"
           />
           
           {/* Marionette region */}
           <path 
             d="M 155 340 Q 150 360 148 380"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="3 2"
             opacity="0.3"
           />
           <path 
             d="M 245 340 Q 250 360 252 380"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="3 2"
             opacity="0.3"
           />
           
           {/* Chin */}
           <ellipse 
             cx="200" cy="385" rx="25" ry="15"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="4 2"
             opacity="0.2"
           />
           
           {/* Jawline / Masseter region */}
           <ellipse 
             cx="100" cy="330" rx="25" ry="35"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="4 2"
             opacity="0.2"
           />
           <ellipse 
             cx="300" cy="330" rx="25" ry="35"
             fill="none"
             stroke="hsl(var(--muted-foreground))"
             strokeWidth="0.5"
             strokeDasharray="4 2"
             opacity="0.2"
           />
           
           {/* Neck indication */}
           <path 
             d="M 160 415 L 160 480 M 240 415 L 240 480"
             fill="none"
             stroke="hsl(var(--border))"
             strokeWidth="1"
             opacity="0.3"
           />
         </g>
       )}
       
       {/* Face - Left Lateral View */}
       {viewType === 'left_lateral' && (
         <g className="face-left-lateral" filter="url(#softShadow)">
           <ellipse 
             cx="220" cy="250" rx="100" ry="170" 
             fill="url(#skinGradient)" 
             stroke="hsl(var(--border))" 
             strokeWidth="1.5" 
           />
           <path 
             d="M 180 180 Q 120 200 140 280 Q 120 320 180 360" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5"
             opacity="0.6"
           />
           <ellipse cx="160" cy="200" rx="18" ry="10" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.8" />
           <circle cx="160" cy="200" r="5" fill="hsl(var(--foreground))" opacity="0.6" />
           <path d="M 150 175 Q 180 165 200 172" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
           <path d="M 130 265 L 145 335" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.6" />
         </g>
       )}
       
       {/* Face - Right Lateral View */}
       {viewType === 'right_lateral' && (
         <g className="face-right-lateral" filter="url(#softShadow)">
           <ellipse 
             cx="180" cy="250" rx="100" ry="170" 
             fill="url(#skinGradient)" 
             stroke="hsl(var(--border))" 
             strokeWidth="1.5" 
           />
           <path 
             d="M 220 180 Q 280 200 260 280 Q 280 320 220 360" 
             fill="none" 
             stroke="hsl(var(--foreground))" 
             strokeWidth="1.5"
             opacity="0.6"
           />
           <ellipse cx="240" cy="200" rx="18" ry="10" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.8" />
           <circle cx="240" cy="200" r="5" fill="hsl(var(--foreground))" opacity="0.6" />
           <path d="M 200 172 Q 220 165 250 175" fill="none" stroke="hsl(var(--foreground))" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
           <path d="M 255 335 L 270 265" fill="none" stroke="hsl(var(--foreground))" strokeWidth="1.5" opacity="0.6" />
         </g>
       )}
       
       {/* Editing indicator */}
       {isEditing && selectedMuscle && (
         <text 
           x="200" 
           y="30" 
           textAnchor="middle" 
           fontSize="13" 
           fill="hsl(var(--primary))"
           fontWeight="500"
         >
           Clique no mapa para marcar o ponto
         </text>
       )}
       
       {/* Application Points */}
       {filteredApplications.map((app) => {
         const x = (app.position_x / 100) * 400;
         const y = (app.position_y / 100) * 520;
         const isSelected = selectedPointId === app.id;
         const color = PROCEDURE_COLORS[app.procedure_type];
         
         return (
           <g
             key={app.id}
             className="cursor-pointer transition-transform"
             onClick={(e) => {
               e.stopPropagation();
               onPointClick?.(app);
             }}
           >
             {/* Outer ring for selection */}
             {isSelected && (
               <circle
                 cx={x}
                 cy={y}
                 r={16}
                 fill="none"
                 stroke={color}
                 strokeWidth={2}
                 opacity={0.4}
               />
             )}
             {/* Point circle */}
             <circle
               cx={x}
               cy={y}
               r={isSelected ? 12 : 10}
               fill={color}
               stroke="white"
               strokeWidth={2}
               className="drop-shadow-md"
             />
             {/* Quantity label */}
             <text
               x={x}
               y={y + 4}
               textAnchor="middle"
               fontSize="9"
               fontWeight="600"
               fill="white"
             >
               {app.quantity}
             </text>
           </g>
         );
       })}
       
       {/* Minimal legend at bottom */}
       <g transform="translate(80, 490)">
         <circle cx="0" cy="0" r="5" fill={PROCEDURE_COLORS.toxin} />
         <text x="12" y="4" fontSize="10" fill="hsl(var(--muted-foreground))">Toxina</text>
         
         <circle cx="90" cy="0" r="5" fill={PROCEDURE_COLORS.filler} />
         <text x="102" y="4" fontSize="10" fill="hsl(var(--muted-foreground))">Preenchimento</text>
         
         <circle cx="210" cy="0" r="5" fill={PROCEDURE_COLORS.biostimulator} />
         <text x="222" y="4" fontSize="10" fill="hsl(var(--muted-foreground))">Bioestimulador</text>
       </g>
     </svg>
   );
 }