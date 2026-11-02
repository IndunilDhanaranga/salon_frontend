"use client";

import { FileText, ChevronDown } from "lucide-react";
import type { PayrollRun, Tenant } from "@/lib/types";
import { money } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";

export function PayrollView({
  runs,
  tenant,
}: {
  runs: PayrollRun[];
  tenant: Tenant;
}) {
  const { t, language } = useTranslation();
  return (
    <>
      <div className="payroll-notice">
        <FileText size={21} />
        <div>
          <strong>{t.payroll.noticeTitle}</strong>
          <p>{t.payroll.noticeDesc}</p>
        </div>
        <span className="status booked">{t.payroll.draftsOnly}</span>
      </div>
      {!runs.length ? (
        <div className="panel empty-state">
          <FileText size={28} strokeWidth={1.3} />
          <h2>{t.payroll.emptyTitle}</h2>
          <p>{t.payroll.emptyDesc}</p>
        </div>
      ) : (
        <div className="payroll-runs">
          {runs.map((run) => (
            <details className="panel payroll-run" key={run.id}>
              <summary>
                <div className="payroll-icon">
                  <FileText size={22} />
                </div>
                <div className="payroll-period">
                  <h2>
                    {new Intl.DateTimeFormat(language === "si" ? "si-LK" : "en", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    }).format(
                      new Date(`${run.period_start.slice(0, 10)}T12:00:00Z`),
                    )}
                  </h2>
                  <p>
                    {run.items.length} {t.payroll.teamMembersCount} ·{" "}
                    {run.period_start.slice(0, 10)} -{" "}
                    {run.period_end.slice(0, 10)}
                  </p>
                </div>
                <span className="status booked">{t.payroll.draft}</span>
                <strong className="payroll-total">
                  {money(run.total_minor, tenant.currency)}
                </strong>
                <ChevronDown size={19} />
              </summary>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>{t.payroll.member}</th>
                      <th>{t.payroll.salary}</th>
                      <th>{t.payroll.commissionEarned}</th>
                      <th>{t.payroll.allowances}</th>
                      <th>{t.payroll.deductions}</th>
                      <th>{t.payroll.netPay}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.staff_name}</strong>
                        </td>
                        <td>
                          {money(item.base_salary_minor, tenant.currency)}
                        </td>
                        <td>{money(item.commission_minor, tenant.currency)}</td>
                        <td>{money(item.allowance_minor, tenant.currency)}</td>
                        <td>{money(item.deduction_minor, tenant.currency)}</td>
                        <td>
                          <strong>
                            {money(item.net_minor, tenant.currency)}
                          </strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
