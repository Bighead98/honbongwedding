export default function Chrysanthemum() {
  return (
    <svg
      className="memorial-flower"
      viewBox="0 0 32 32"
      width="18"
      height="18"
      role="img"
      aria-label="추모 국화꽃"
    >
      <g fill="#fffdf8" stroke="#a3a391" strokeWidth="0.8">
        {Array.from({ length: 16 }, (_, index) => (
          <ellipse
            key={index}
            cx="16"
            cy="8.5"
            rx="2.2"
            ry="6.5"
            transform={`rotate(${index * 22.5} 16 16)`}
          />
        ))}
        {Array.from({ length: 12 }, (_, index) => (
          <ellipse
            key={index}
            cx="16"
            cy="11.5"
            rx="1.6"
            ry="4.3"
            transform={`rotate(${index * 30 + 15} 16 16)`}
          />
        ))}
      </g>
      <circle cx="16" cy="16" r="2.6" fill="#c5ba8d" />
    </svg>
  );
}
