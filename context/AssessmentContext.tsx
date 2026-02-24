"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AssessmentContextValue,
  type AssessmentResults,
  type IntakeFormData,
  EMPTY_INTAKE,
} from "@/types/assessment";

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

const SESSION_KEY = "frs-assessment-state";

export function AssessmentProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [intake, setIntakeState] = useState<IntakeFormData>(EMPTY_INTAKE);
  const [results, setResultsState] = useState<AssessmentResults>({});
  const [completedSteps, setCompletedStepsState] = useState<number[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  // Hydrate from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          intake?: IntakeFormData;
          results?: AssessmentResults;
          completedSteps?: number[];
          demoMode?: boolean;
        };
        if (parsed.intake) setIntakeState(parsed.intake);
        if (parsed.results) setResultsState(parsed.results);
        if (parsed.completedSteps) setCompletedStepsState(parsed.completedSteps);
        if (parsed.demoMode) setDemoMode(parsed.demoMode);
      }
    } catch (e) {
      console.warn("[STATE] Failed to hydrate from sessionStorage:", e);
    }
    setIsHydrated(true);
  }, []);

  // Persist to sessionStorage on every state change (skip first render before hydration)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!isHydrated) return;
    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ intake, results, completedSteps, demoMode })
      );
    } catch (e) {
      console.warn("[STATE] Failed to persist to sessionStorage:", e);
    }
  }, [intake, results, completedSteps, demoMode, isHydrated]);

  const setIntake = useCallback((data: IntakeFormData) => {
    setIntakeState(data);
  }, []);

  // Merge setter — existing screens use partial updates like setResults({ roadmap: parsed })
  const setResults = useCallback((newResults: AssessmentResults) => {
    setResultsState((prev) => ({ ...prev, ...newResults }));
  }, []);

  const markStepComplete = useCallback((step: number) => {
    setCompletedStepsState((prev) =>
      prev.includes(step) ? prev : [...prev, step]
    );
  }, []);

  const isStepCompleted = useCallback(
    (step: number) => completedSteps.includes(step),
    [completedSteps]
  );

  const resetAssessment = useCallback(() => {
    setIntakeState(EMPTY_INTAKE);
    setResultsState({});
    setCompletedStepsState([]);
    setDemoMode(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn("[STATE] Failed to clear sessionStorage:", e);
    }
  }, []);

  const value = useMemo<AssessmentContextValue>(
    () => ({
      intake,
      setIntake,
      results,
      setResults,
      completedSteps,
      markStepComplete,
      isStepCompleted,
      demoMode,
      setDemoMode,
      isHydrated,
      resetAssessment,
    }),
    [
      intake,
      setIntake,
      results,
      setResults,
      completedSteps,
      markStepComplete,
      isStepCompleted,
      demoMode,
      isHydrated,
      resetAssessment,
    ]
  );

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): AssessmentContextValue {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within an AssessmentProvider");
  }
  return context;
}
