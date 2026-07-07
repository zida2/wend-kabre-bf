export default function Logo({ size = 32, className = '' }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0d9488" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
      </defs>
      
      {/* W central avec fondations solides */}
      <path 
        d="M 120 150 L 190 380 L 256 220 L 322 380 L 392 150" 
        stroke="url(#brandGrad)" 
        strokeWidth="52" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
            
      {/* Flèche de croissance / K stylisé */}
      <path 
        d="M 256 220 L 420 80 M 310 80 L 420 80 L 420 190" 
        stroke="#10b981" 
        strokeWidth="52" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
