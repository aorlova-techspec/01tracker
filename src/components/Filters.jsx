import { FILTERS } from "../utils/tasks.js";

export default function Filters({ current, onChange, counts }) {
  return (
    <div className="filters" role="group" aria-label="Фильтр задач">
      {FILTERS.map((filter) => {
        const isActive = current === filter.id;
        const count = counts[filter.id];

        return (
          <button
            key={filter.id}
            type="button"
            className={`filter-btn ${isActive ? "filter-btn--active" : ""}`}
            aria-pressed={isActive}
            onClick={() => onChange(filter.id)}
          >
            {filter.label}
            <span className="filter-btn__count">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
