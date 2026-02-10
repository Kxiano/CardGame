'use client';

interface OtherPlayerGiftingModalProps {
  isOpen: boolean;
  playerNames: string[];
  drinksToDistribute: number;
  onConfirm: () => void;
}

export function OtherPlayerGiftingModal({
  isOpen,
  playerNames,
  drinksToDistribute,
  onConfirm,
}: OtherPlayerGiftingModalProps) {
  if (!isOpen) return null;

  // Parse player names if they're joined by " & "
  const players = playerNames.length === 1 && playerNames[0].includes(' & ')
    ? playerNames[0].split(' & ')
    : playerNames;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="w-full max-w-sm mx-4 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        {/* Glow Effect */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Hourglass Icon with Spinning Borders */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full animate-pulse" />
          <div className="relative w-24 h-24 bg-gray-900 border border-gold/40 rounded-full flex items-center justify-center shadow-lg">
            {/* Inner spinning borders */}
            <div className="absolute inset-1 border-2 border-gold/30 border-t-gold rounded-full animate-spin" style={{ animationDuration: '3s' }} />
            <div className="absolute inset-3 border-2 border-gold/10 border-b-gold/60 rounded-full animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            {/* Hourglass emoji */}
            <span className="text-4xl">⏳</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8 space-y-3">
          <h2 className="text-2xl font-black text-white uppercase tracking-widest leading-tight">
            Players Assigning<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-light">
              Drinks
            </span>
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1 h-1 rounded-full bg-gold animate-pulse" />
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
              Selections in Progress
            </p>
            <div className="w-1 h-1 rounded-full bg-gold animate-pulse" />
          </div>
        </div>

        {/* Player Cards */}
        <div className="w-full space-y-3 px-2">
          {players.map((playerName, index) => (
            <div 
              key={index}
              className="relative overflow-hidden bg-gray-900/90 border border-gold/30 rounded-xl p-4 flex items-center gap-4 shadow-lg backdrop-blur-md"
            >
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent animate-pulse"
                style={{ animationDelay: `${index * 0.5}s` }}
              />
              
              {/* Avatar */}
              <div className="relative w-12 h-12 shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gold/20 animate-ping opacity-75" />
                <div className="relative w-full h-full rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-bold text-lg border-2 border-gold/40">
                  {playerName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold text-sm tracking-wide">
                    {playerName}
                  </span>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20">
                    <span className="w-1 h-1 rounded-full bg-gold animate-pulse" />
                    <span className="text-xs font-bold text-gold uppercase tracking-wider">
                      Choosing
                    </span>
                  </span>
                </div>
                <p className="text-white/50 text-xs">
                  Selecting a victim... 🎯
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Drinks Info */}
        <div className="mt-6 flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-lg">
          <span className="text-2xl">🍺</span>
          <span className="text-gold font-bold">
            {drinksToDistribute} {drinksToDistribute === 1 ? 'drink' : 'drinks'} each to distribute
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onConfirm}
          className="mt-6 py-3 px-8 rounded-xl font-bold text-gray-900 bg-gold hover:bg-gold-light transition-all shadow-lg"
        >
          Got it!
        </button>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2 opacity-30">
          <div className="h-8 w-px bg-gradient-to-b from-transparent via-gold to-transparent" />
          <span className="text-xs italic text-gold tracking-widest">
            Gift Row • Pyramid Phase
          </span>
        </div>
      </div>
    </div>
  );
}
