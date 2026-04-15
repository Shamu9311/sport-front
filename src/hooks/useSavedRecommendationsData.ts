import { useState, useRef, useCallback, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import { getSavedRecommendations, getUserFeedbackHistory } from '../services/api';
import { MIN_SKELETON_MS, withMinimumDuration } from '../utils/withMinimumDuration';

/**
 * Carga recomendaciones guardadas + historial de feedback (lógica extraída de recommendations.tsx).
 */
export function useSavedRecommendationsData() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthContext must be used within an AuthProvider');
  const { userToken, user } = context;

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [negativeRecommendations, setNegativeRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const isFetchingRef = useRef(false);
  const listLengthsRef = useRef({ pos: 0, neg: 0 });
  listLengthsRef.current = {
    pos: recommendations.length,
    neg: negativeRecommendations.length,
  };

  const fetchRecommendations = useCallback(
    async (isRefresh = false) => {
      if (isFetchingRef.current && !isRefresh) {
        return;
      }

      if (!userToken) {
        setError('Debes iniciar sesión para obtener recomendaciones.');
        if (!isRefresh) setLoading(false);
        else setRefreshing(false);
        return;
      }

      const hasData = listLengthsRef.current.pos + listLengthsRef.current.neg > 0;
      const showSkeleton = !isRefresh && !hasData;

      isFetchingRef.current = true;
      if (showSkeleton) setLoading(true);
      setError(null);

      try {
        const userId = user?.id;
        if (!userId) {
          throw new Error('No se pudo obtener el ID del usuario');
        }

        const fetchPair = Promise.all([getSavedRecommendations(), getUserFeedbackHistory()]);
        const [savedRecommendations, feedbackResponse] =
          isRefresh || !showSkeleton
            ? await fetchPair
            : await withMinimumDuration(fetchPair, MIN_SKELETON_MS);

        const feedbackMap: { [key: number]: string } = {};
        if (feedbackResponse.success && feedbackResponse.feedback) {
          feedbackResponse.feedback.forEach((f: any) => {
            feedbackMap[f.product_id] = f.feedback;
          });
        }

        const sessionBasedRecs =
          savedRecommendations && Array.isArray(savedRecommendations)
            ? savedRecommendations.filter(
                (rec: any) => rec.session_id != null && rec.session_id !== ''
              )
            : [];

        if (sessionBasedRecs.length > 0) {
          const positiveRecs: any[] = [];
          const negativeRecs: any[] = [];

          sessionBasedRecs.forEach((rec: any) => {
            const productId = rec.product_id || rec.product_details?.product_id;
            const feedback = feedbackMap[productId];
            if (feedback === 'negativo') {
              negativeRecs.push(rec);
            } else {
              positiveRecs.push(rec);
            }
          });

          const seenNamesPos = new Set<string>();
          const uniquePositiveRecs = positiveRecs.filter((rec: any) => {
            const productName =
              rec.product_details?.name ||
              rec.product_details?.product_name ||
              rec.name ||
              rec.product_name ||
              '';
            if (!productName || seenNamesPos.has(productName)) return false;
            seenNamesPos.add(productName);
            return true;
          });

          const seenNamesNeg = new Set<string>();
          const uniqueNegativeRecs = negativeRecs.filter((rec: any) => {
            const productName =
              rec.product_details?.name ||
              rec.product_details?.product_name ||
              rec.name ||
              rec.product_name ||
              '';
            if (!productName || seenNamesNeg.has(productName)) return false;
            seenNamesNeg.add(productName);
            return true;
          });

          setRecommendations(uniquePositiveRecs);
          setNegativeRecommendations(uniqueNegativeRecs);
        } else {
          setRecommendations([]);
          setNegativeRecommendations([]);
        }
      } catch (err: any) {
        let errorMessage = 'Error al obtener recomendaciones. Intenta más tarde.';
        if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
        console.error('Error obteniendo recomendaciones:', err);
        setError(errorMessage);
        setRecommendations([]);
        setNegativeRecommendations([]);
      } finally {
        isFetchingRef.current = false;
        if (!isRefresh) setLoading(false);
        else setRefreshing(false);
      }
    },
    [userToken, user?.id]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRecommendations(true);
  }, [fetchRecommendations]);

  return {
    recommendations,
    negativeRecommendations,
    loading,
    error,
    refreshing,
    fetchRecommendations,
    onRefresh,
  };
}
