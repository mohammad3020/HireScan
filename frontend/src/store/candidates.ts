import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CandidateCategory = 'none' | 'interview_scheduled' | 'interviewed' | 'offer_sent' | 'hired';

interface CandidatesState {
  favorites: Record<number, boolean>;
  categories: Record<number, CandidateCategory>;
  
  setFavorite: (candidateId: number, isFavorite: boolean) => void;
  setCategory: (candidateId: number, category: CandidateCategory) => void;
  initializeFromCandidates: (candidates: Array<{ id: number; isFavorite: boolean; category: CandidateCategory }>) => void;
}

export const useCandidatesStore = create<CandidatesState>()(
  persist(
    (set) => ({
      favorites: {},
      categories: {},
      
      setFavorite: (candidateId, isFavorite) =>
        set((state) => ({
          favorites: {
            ...state.favorites,
            [candidateId]: isFavorite,
          },
        })),
      
      setCategory: (candidateId, category) =>
        set((state) => ({
          categories: {
            ...state.categories,
            [candidateId]: category,
          },
        })),
      
      initializeFromCandidates: (candidates) =>
        set((state) => {
          const newFavorites: Record<number, boolean> = { ...state.favorites };
          const newCategories: Record<number, CandidateCategory> = { ...state.categories };
          
          candidates.forEach((candidate) => {
            if (!(candidate.id in newFavorites)) {
              newFavorites[candidate.id] = candidate.isFavorite;
            }
            if (!(candidate.id in newCategories)) {
              newCategories[candidate.id] = candidate.category;
            }
          });
          
          return {
            favorites: newFavorites,
            categories: newCategories,
          };
        }),
    }),
    {
      name: 'candidates-storage',
    }
  )
);

