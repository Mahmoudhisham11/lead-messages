import { useState, useEffect } from "react";
import { QueryConstraint } from "firebase/firestore";
import {
  subscribeToCollection,
  FirestoreDocument,
} from "@/services/firebase/firestore";

interface UseFirestoreQueryResult {
  data: FirestoreDocument[];
  loading: boolean;
  error: Error | null;
}

export function useFirestoreQuery(
  userId: string | null | undefined,
  collectionName: string,
  queryConstraints: QueryConstraint[] = []
): UseFirestoreQueryResult {
  const [data, setData] = useState<FirestoreDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !!userId);
  const [error] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return undefined;

    let isMounted = true;

    const unsubscribe = subscribeToCollection(
      collectionName,
      (results) => {
        if (isMounted) {
          setData(results.filter((item) => item.userId === userId));
          setLoading(false);
        }
      },
      queryConstraints
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId, collectionName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
}
