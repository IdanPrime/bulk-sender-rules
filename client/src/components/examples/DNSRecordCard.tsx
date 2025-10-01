import DNSRecordCard from "../DNSRecordCard";

export default function DNSRecordCardExample() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <DNSRecordCard
        type="SPF"
        status="PASS"
        record="v=spf1 include:_spf.google.com ~all"
      />
      <DNSRecordCard
        type="DMARC"
        status="WARN"
        record="v=DMARC1; p=none; rua=mailto:dmarc@example.com"
        issues={["Policy set to 'none' - not enforcing"]}
        suggestions={["Change policy to 'quarantine' or 'reject'"]}
      />
      <DNSRecordCard
        type="DKIM"
        status="FAIL"
        issues={["No DKIM record found"]}
        suggestions={["Add DKIM selector 'default._domainkey.example.com'"]}
      />
    </div>
  );
}
