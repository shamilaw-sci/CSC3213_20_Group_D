/**
 * @file    FaqAccordion.jsx
 * @module  Common
 * @desc    Reusable, page-contextual FAQ accordion. Renders a numbered,
 *          connected-rail list of questions where one (or optionally several)
 *          can be expanded at a time. Each expanded answer includes a
 *          lightweight "was this helpful" control wired to onFeedback for
 *          backend logging.
 * @author  Wasana Karunanayaka (S/21/081)
 */

import { useState } from "react";
import { ChevronDown, ThumbsUp, ThumbsDown, Check } from "lucide-react";

/**
 * @component FaqAccordion
 * @desc      Displays a set of FAQs for a given page context, with per-item
 *            expand/collapse and helpful/not-helpful feedback.
 * @param {string}   title             - Section heading (e.g. "FAQs — Prescriptions")
 * @param {Array}    items             - [{ id, question, answer, category? }]
 * @param {boolean}  allowMultipleOpen - If true, more than one answer can be open at once. Default false.
 * @param {Function} onFeedback        - Optional callback(id, wasHelpful: boolean) for logging to the backend.
 */
const FaqAccordion = ({ title = "Frequently Asked Questions", items = [], allowMultipleOpen = false, onFeedback }) => {
  const [openIds, setOpenIds] = useState(() => new Set(items[0] ? [items[0].id] : []));
  const [feedbackGiven, setFeedbackGiven] = useState({});

  if (!items || items.length === 0) return null;

  const toggle = (id) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultipleOpen ? prev : []);
      if (prev.has(id) && allowMultipleOpen) {
        next.delete(id);
      } else if (!prev.has(id)) {
        next.add(id);
      }
      return next;
    });
  };

  const handleFeedback = (id, wasHelpful) => {
    if (feedbackGiven[id]) return;
    setFeedbackGiven((prev) => ({ ...prev, [id]: wasHelpful ? "up" : "down" }));
    onFeedback?.(id, wasHelpful);
  };

  return (
    <section className="w-full max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold tracking-[-0.02em] text-brand-deep mb-6">{title}</h2>

      <div className="relative">
        {items.map((item, index) => {
          const isOpen = openIds.has(item.id);
          const isLast = index === items.length - 1;

          return (
            <div key={item.id} className="relative flex gap-4">
              {/* Numbered rail */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-colors duration-200 ${
                    isOpen ? "bg-primary" : "bg-brand-deep"
                  }`}
                >
                  {index + 1}
                </div>
                {!isLast && <div className="w-px flex-1 bg-brand-deep/10 my-1" />}
              </div>

              {/* Question / answer */}
              <div className={`flex-1 ${isLast ? "" : "pb-3"}`}>
                <button
                  onClick={() => toggle(item.id)}
                  aria-expanded={isOpen}
                  className={`w-full text-left flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 transition-colors duration-150 ${
                    isOpen ? "bg-primary/5 border border-primary/20" : "bg-white border border-brand-deep/10 hover:border-primary/30"
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className={`font-semibold text-[15px] leading-snug ${isOpen ? "text-primary" : "text-brand-deep"}`}>
                      {item.question}
                    </span>
                    {item.category && (
                      <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-brand-deep/5 text-brand-deep/60 whitespace-nowrap">
                        {item.category}
                      </span>
                    )}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`grid transition-all duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-l-2 border-primary pl-4 pr-2 py-1 text-[14px] leading-relaxed text-gray-700">
                      {item.answer}

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-brand-deep/10">
                        {feedbackGiven[item.id] ? (
                          <span className="flex items-center gap-1.5 text-[12px] font-medium text-success">
                            <Check size={13} /> Thanks for the feedback
                          </span>
                        ) : (
                          <>
                            <span className="text-[12px] text-gray-500">Was this helpful?</span>
                            <button
                              onClick={() => handleFeedback(item.id, true)}
                              className="flex items-center gap-1 text-[12px] font-medium text-primary hover:bg-primary/10 rounded-md px-2 py-1 transition-colors"
                            >
                              <ThumbsUp size={13} /> Yes
                            </button>
                            <button
                              onClick={() => handleFeedback(item.id, false)}
                              className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:bg-brand-deep/5 rounded-md px-2 py-1 transition-colors"
                            >
                              <ThumbsDown size={13} /> No
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FaqAccordion;