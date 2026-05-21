

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1] bg-light-bg">
      {/* Animated Gradient Orbs */}
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-pastel-pink/30 blur-[100px] animate-gradient mix-blend-multiply" />
      <div className="absolute top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-pastel-cyan/30 blur-[120px] animate-gradient mix-blend-multiply" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-pastel-purple/30 blur-[100px] animate-gradient mix-blend-multiply" style={{ animationDelay: '4s' }} />

      {/* Moving Grid */}
      <div className="absolute inset-0 bg-grid animate-grid opacity-60"></div>

      {/* Floating Pixel Shapes */}
      <div className="absolute top-[15%] left-[10%] animate-float-slow">
        <div className="pixel-star scale-150 opacity-40"></div>
      </div>
      <div className="absolute top-[40%] right-[15%] animate-float-medium">
        <div className="pixel-heart scale-150 opacity-40"></div>
      </div>
      <div className="absolute bottom-[25%] left-[20%] animate-float-slow" style={{ animationDelay: '1s' }}>
        <div className="pixel-star scale-125 opacity-30"></div>
      </div>
      <div className="absolute top-[20%] right-[30%] animate-float-medium" style={{ animationDelay: '2s' }}>
        <div className="pixel-heart scale-100 opacity-50"></div>
      </div>
      <div className="absolute bottom-[15%] right-[25%] animate-float-slow" style={{ animationDelay: '3s' }}>
        <div className="pixel-star scale-150 opacity-40"></div>
      </div>
      <div className="absolute top-[60%] left-[5%] animate-float-medium" style={{ animationDelay: '1.5s' }}>
        <div className="pixel-heart scale-75 opacity-60"></div>
      </div>
    </div>
  );
}
