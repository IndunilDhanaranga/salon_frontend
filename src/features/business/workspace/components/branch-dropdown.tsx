"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  ChevronDown,
  Check,
  Globe,
  Settings,
  MapPin,
} from "lucide-react";
import type { Branch } from "@/lib/types";
import { useTranslation } from "@/lib/i18n";

type Props = {
  branches: Branch[];
  activeBranchId: string | null;
  selectedBranchId: string;
  hasAllBranchesAccess: boolean;
  onSelectBranch: (id: string) => void;
  onManageBranches?: () => void;
  disabled?: boolean;
};

export function BranchDropdown({
  branches,
  selectedBranchId,
  hasAllBranchesAccess,
  onSelectBranch,
  onManageBranches,
  disabled = false,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // If no branches or user only has 1 branch and cannot access all branches
  if (branches.length === 0) return null;

  const currentBranch =
    selectedBranchId !== "all"
      ? branches.find((b) => b.id === selectedBranchId)
      : null;

  const isAll = selectedBranchId === "all";

  // If user only has access to one branch and cannot view all, display single badge
  if (branches.length === 1 && !hasAllBranchesAccess) {
    const single = branches[0];
    return (
      <div className="branch-badge-pill" title={single.name}>
        <Building2 size={15} />
        <span>{single.name}</span>
        {single.code && <span className="branch-code-tag">{single.code}</span>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="branch-dropdown-wrapper"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        className={`branch-select-button ${open ? "open" : ""}`}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t.branches.switchBranch}
      >
        {isAll ? (
          <Globe size={15} className="branch-icon-globe" />
        ) : (
          <Building2 size={15} className="branch-icon-store" />
        )}
        <span className="branch-name-label">
          {isAll
            ? `${t.branches.allBranches} (${t.branches.centralized})`
            : (currentBranch?.name ?? t.branches.mainBranch)}
        </span>
        {currentBranch?.is_main && (
          <span className="branch-main-chip">{t.branches.mainBranch}</span>
        )}
        <ChevronDown
          size={14}
          className={`branch-chevron ${open ? "rotate" : ""}`}
        />
      </button>

      {open && (
        <div className="branch-dropdown-menu" role="menu">
          <div className="branch-dropdown-header">
            <span>{t.branches.switchBranch}</span>
          </div>

          {hasAllBranchesAccess && (
            <>
              <button
                type="button"
                role="menuitem"
                className={`branch-dropdown-item ${isAll ? "active" : ""}`}
                onClick={() => {
                  onSelectBranch("all");
                  setOpen(false);
                }}
              >
                <Globe size={15} />
                <div className="branch-item-text">
                  <div className="branch-item-title">
                    {t.branches.allBranches}
                    <span className="branch-pill-sub">
                      {t.branches.centralized}
                    </span>
                  </div>
                  <span className="branch-item-sub">
                    {t.branches.allBranchesDesc}
                  </span>
                </div>
                {isAll && <Check size={15} className="branch-check-icon" />}
              </button>
              <div className="branch-dropdown-divider" />
            </>
          )}

          <div className="branch-items-scroll">
            {branches.map((branch) => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  role="menuitem"
                  className={`branch-dropdown-item ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    onSelectBranch(branch.id);
                    setOpen(false);
                  }}
                >
                  <Building2 size={15} />
                  <div className="branch-item-text">
                    <div className="branch-item-title">
                      <span>{branch.name}</span>
                      {branch.is_main && (
                        <span className="branch-main-chip">
                          {t.branches.mainBranch}
                        </span>
                      )}
                      {branch.code && (
                        <span className="branch-code-tag">{branch.code}</span>
                      )}
                    </div>
                    {branch.address && (
                      <span className="branch-item-sub">
                        <MapPin
                          size={11}
                          style={{ display: "inline", marginRight: 3 }}
                        />
                        {branch.address}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <Check size={15} className="branch-check-icon" />
                  )}
                </button>
              );
            })}
          </div>

          {onManageBranches && (
            <>
              <div className="branch-dropdown-divider" />
              <button
                type="button"
                role="menuitem"
                className="branch-dropdown-item branch-manage-item"
                onClick={() => {
                  setOpen(false);
                  onManageBranches();
                }}
              >
                <Settings size={14} />
                <span>{t.branches.manageBranches}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
