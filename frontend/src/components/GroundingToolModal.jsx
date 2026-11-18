import React, { useState } from 'react';
import { X, Eye, Hand, Volume2, Sparkles, CheckCircle2, RotateCcw, Heart, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function GroundingToolModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedItems, setCheckedItems] = useState({});

  if (!isOpen) return null;

  const steps = [
    {
      count: 5,
      sense: 'SEE',
      icon: Eye,
      title: '5 Things You Can See',
      description: 'Look around your room or desk. Notice small visual details you would normally ignore.',
      items: [
        'A texture on the desk or notebook',
        'A shadow or patch of light on the wall',
        'A specific color in your surroundings',
        'An object on the shelf or floor',
        'A small detail on your laptop or phone casing',
      ],
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      count: 4,
      sense: 'TOUCH',
      icon: Hand,
      title: '4 Things You Can Physically Feel',
      description: 'Bring awareness to physical contact points anchoring you to the present moment.',
      items: [
        'The pressure of your feet against the floor',
        'The texture of the fabric of your clothes',
        'The cool surface of your table or chair armrest',
        'The sensation of air moving against your skin',
      ],
      badgeColor: 'bg-mint-100 text-mint-800 border-mint-200',
    },
    {
      count: 3,
      sense: 'HEAR',
      icon: Volume2,
      title: '3 Things You Can Hear',
      description: 'Listen closely beyond the room. Tune into subtle ambient acoustic layers.',
      items: [
        'A distant hum of campus or hostel life',
        'The soft whir of a fan or laptop cooling',
        'The sound of your own quiet, steady breathing',
      ],
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      count: 2,
      sense: 'SMELL',
      icon: Sparkles,
      title: '2 Things You Can Smell',
      description: 'Gently breathe in. Can you perceive any scent in the air or on your wrist?',
      items: [
        'Fresh air from a window or hallway',
        'The scent of paper, coffee, or soap',
      ],
      badgeColor: 'bg-coral-100 text-coral-800 border-coral-200',
    },
    {
      count: 1,
      sense: 'TASTE',
      icon: Heart,
      title: '1 Thing You Can Taste',
      description: 'Notice the lingering taste of mint, tea, water, or simply the presence of your breath.',
      items: [
        'Take a slow sip of cool water and notice the sensation',
      ],
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    },
  ];

  const current = steps[currentStep];
  const isFinalStep = currentStep === steps.length - 1;

  const toggleItem = (idx) => {
    const key = `${currentStep}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allItemsChecked = current.items.every((_, idx) => checkedItems[`${currentStep}-${idx}`]);

  const handleNext = () => {
    if (isFinalStep) {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A78BFA', '#34D399', '#FBBF24'],
      });
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setCheckedItems({});
  };

  const CurrentIcon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FFFDF9] rounded-4xl max-w-lg w-full shadow-2xl border border-cream-200 overflow-hidden p-6 sm:p-8 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-charcoal-400 hover:text-charcoal-700 hover:bg-cream-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i === currentStep
                  ? 'bg-purple-600 shadow-glow-lavender'
                  : i < currentStep
                  ? 'bg-purple-400'
                  : 'bg-cream-200'
              }`}
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${current.badgeColor}`}>
                Step {currentStep + 1} of 5 • {current.sense}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-charcoal-900 mt-0.5">
              {current.title}
            </h2>
          </div>
        </div>

        <p className="text-xs text-charcoal-600 mb-5 leading-relaxed">
          {current.description}
        </p>

        {/* Checklist */}
        <div className="space-y-2 mb-6">
          {current.items.map((item, idx) => {
            const isChecked = !!checkedItems[`${currentStep}-${idx}`];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleItem(idx)}
                className={`w-full p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center gap-3 ${
                  isChecked
                    ? 'bg-mint-50/80 border-mint-300 text-charcoal-900 shadow-wellness-sm'
                    : 'bg-white border-cream-200 text-charcoal-700 hover:bg-cream-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                    isChecked
                      ? 'bg-mint-500 border-mint-500 text-white'
                      : 'border-cream-300 bg-white'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-4 h-4" />}
                </div>
                <span className={isChecked ? 'line-through text-charcoal-400' : ''}>
                  {item}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-cream-200/80">
          <button
            onClick={handleReset}
            className="text-xs font-bold text-charcoal-400 hover:text-charcoal-700 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Exercise</span>
          </button>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-glow-lavender transition"
          >
            {isFinalStep ? 'Complete Grounding ✨' : 'Next Step →'}
          </button>
        </div>
      </div>
    </div>
  );
}
