export default function ProjectSelect({ id, value, onChange, options, placeholder = "Без проекта" }) {
  const values = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <select
      id={id}
      className="input select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {values.map((project) => (
        <option key={project} value={project}>
          {project}
        </option>
      ))}
    </select>
  );
}
