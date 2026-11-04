"use client";

import { ArrowUpRight, Users } from "lucide-react";
import type { Staff, Tenant } from "@/lib/types";
import { initials, money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function TeamView({
  staff,
  tenant,
  onEdit,
}: {
  staff: Staff[];
  tenant: Tenant;
  onEdit?: (person: Staff) => void;
}) {
  const { t } = useTranslation();
  if (!staff.length)
    return (
      <div className="panel empty-state">
        <Users size={28} />
        <h2>{t.team.emptyTitle}</h2>
        <p>{t.team.emptyDesc}</p>
      </div>
    );
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{t.team.peopleBehindChair}</h2>
          <p>
            {staff.filter((person) => person.active).length}{" "}
            {t.team.activeMembersCount}
          </p>
        </div>
        <span className="small-caps">{t.team.yourTeam}</span>
      </div>
      <div className="team-list">
        {staff.map((person) => (
          <article className="team-row" key={person.id}>
            <div className="team-person">
              <span className="avatar large">{initials(person.name)}</span>
              <div>
                <h3>{person.name}</h3>
                <p>
                  {person.job_title}
                  {person.branch_name && (
                    <span
                      className="branch-chip-xs"
                      style={{
                        marginLeft: 6,
                        display: "inline-block",
                        background: "var(--mint)",
                        color: "var(--teal)",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: "0.75rem",
                        fontWeight: 500,
                      }}
                    >
                      {person.branch_name}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="team-contact">
              <span className="small-caps">{t.team.contact}</span>
              <p>{person.email || person.phone || t.team.noContactDetails}</p>
            </div>
            <div>
              <span className="small-caps">{t.team.monthlyBase}</span>
              <p className="money-label">
                {money(person.base_salary_minor, tenant.currency)}
              </p>
            </div>
            <div>
              <span className="small-caps">{t.team.commission}</span>
              <p>{person.commission_bps / 100}%</p>
            </div>
            <span
              className={`status ${person.active ? "completed" : "cancelled"}`}
            >
              {person.active ? t.common.active : t.common.inactive}
            </span>
            {onEdit && (
              <button
                className="row-action edit-action"
                onClick={() => onEdit(person)}
                aria-label={`${t.team.editMember} ${person.name}`}
              >
                <ArrowUpRight size={20} />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
