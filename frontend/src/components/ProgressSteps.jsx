export default function ProgressSteps({ steps, currentIndex }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`pstep flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              i === currentIndex
                ? "pstep--active bg-brand-blue text-white"
                : i < currentIndex
                ? "pstep--done bg-brand-orange/20 text-brand-orange"
                : "pstep--todo bg-gray-100 text-gray-400"
            }`}
          >
            <span>{i + 1}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
          {i < steps.length - 1 && <div className="pstep-line w-6 h-px bg-gray-300" />}
        </div>
      ))}
    </div>
  );
}
