"use client";

import { createContext, useCallback, useContext } from "react";
import { api, type ApiOptions } from "@/lib/api";

const BranchContext = createContext<string | undefined>(undefined);

export function BranchApiProvider({
  branch,
  children,
}: {
  branch?: string;
  children: React.ReactNode;
}) {
  return (
    <BranchContext.Provider value={branch}>{children}</BranchContext.Provider>
  );
}

/** Feature requests inherit the same branch as the workspace toolbar. */
export function useBranchApi() {
  const branch = useContext(BranchContext);
  return useCallback(
    <T,>(path: string, options: ApiOptions = {}) =>
      api<T>(path, { ...options, branch: options.branch ?? branch }),
    [branch],
  );
}
