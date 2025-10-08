interface ScoreBadgeProps {
  score: number;
  className?: string;
  showLabel?: boolean;
}

export default function ScoreBadge({ score, className = "", showLabel = true }: ScoreBadgeProps) {
  const getGradientColor = (score: number) => {
    // Normalize score to 0-1
    const normalized = Math.max(0, Math.min(100, score)) / 100;
    
    // Calculate hue from red (0) to yellow (60) to green (120)
    const hue = normalized * 120;
    
    // Calculate saturation and lightness for better visibility
    const saturation = 70;
    const lightness = 45;
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  const backgroundColor = getGradientColor(score);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${className}`}
      style={{ backgroundColor }}
      data-testid="badge-score"
    >
      <span className="text-white font-bold text-sm" data-testid="text-score-value">
        {score}
      </span>
      {showLabel && (
        <span className="text-white text-xs opacity-90" data-testid="text-score-label">
          {getScoreLabel(score)}
        </span>
      )}
    </div>
  );
}
