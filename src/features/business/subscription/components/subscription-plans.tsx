import { Check } from "lucide-react";
import type { Plan } from "@/lib/types";
import { money } from "@/lib/format";
import { subscriptionFeatures } from "@/lib/access";

export function SubscriptionPlans({ plans }: { plans: Plan[] }) {
  const published = plans.filter((plan) => plan.active);
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Available plans</h2>
          <p>
            Choose the features your business needs, then contact the platform
            administrator.
          </p>
        </div>
      </div>
      {!published.length ? (
        <div className="empty-state">
          <h3>Plans will appear here when published.</h3>
          <p>
            Your platform administrator manages plan availability and
            activation.
          </p>
        </div>
      ) : (
        <div className="subscription-plan-grid">
          {published.map((plan) => (
            <article key={plan.id} className="subscription-plan-card">
              <h3>{plan.name}</h3>
              {plan.description && <p>{plan.description}</p>}
              <div className="subscription-plan-price">
                <strong>{money(plan.price_minor, plan.currency)}</strong>
                <span> / {plan.billing_interval}</span>
              </div>
              <ul className="subscription-feature-list">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} aria-hidden="true" />
                    {subscriptionFeatures.find((item) => item.key === feature)
                      ?.label ?? feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
      <p className="platform-note">
        Plan changes and subscription periods are recorded by the platform
        administrator. This screen does not collect payments or renew a
        subscription automatically.
      </p>
    </section>
  );
}
