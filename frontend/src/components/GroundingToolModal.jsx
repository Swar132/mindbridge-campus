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
      badgeColor: 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800',
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
      badgeColor: 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800',
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
      badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    },
    {
      count: 2,
      sense: 'SMELL',
      icon: Sparkles,
      title: '2 Things You Can Smell',
      description: 'Notice any subtle scents around you, or recall a comforting aroma like fresh rain or coffee.',
      items: [
        'The scent of paper, ink, or a clean room',
        'A hint of soap, fresh air, or your favourite drink',
      ],
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    },
    {
      count: 1,
      sense: 'TASTE',
      icon: Heart,
      title: '1 Thing You Can Taste or Affirm',
      description: 'Notice the lingering taste of mint or water, or speak a grounding positive self-affirmation.',
      items: [
        'A sip of water, or speaking: "I am safe in this moment. I have handled hard things before."',
      ],
      badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-6 sm:p-8 relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
                  ? 'bg-purple-600 dark:bg-purple-500 shadow-sm'
                  : i < currentStep
                  ? 'bg-purple-400 dark:bg-purple-600'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
            <CurrentIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${current.badgeColor}`}>
                Step {currentStep + 1} of 5 • {current.sense}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {current.title}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
          {current.description}
        </p>

        {/* Checklist */}
        <div className="space-y-2.5 mb-6">
          {current.items.map((item, idx) => {
            const isChecked = checkedItems[`${currentStep}-${idx}`];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleItem(idx)}
                className={`w-full p-3.5 rounded-2xl text-left text-xs transition-all flex items-start gap-3 cursor-pointer border ${
                  isChecked
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-200 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition ${
                    isChecked
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                  }`}
                >
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className="leading-snug">{item}</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Start Over
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-sky-600 to-teal-600 hover:from-purple-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition active:scale-95 cursor-pointer"
            >
              {isFinalStep ? 'Finish & Ground ✨' : 'Next Step →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
