import StatusBadge from "../StatusBadge";

export default function StatusBadgeExample() {
  return (
    <div className="flex gap-3">
      <StatusBadge status="PASS" />
      <StatusBadge status="WARN" />
      <StatusBadge status="FAIL" />
    </div>
  );
}
