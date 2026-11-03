import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-quedera-navy via-quedera-deep-blue to-quedera-navy text-quedera-surface py-20">
        <div className="container mx-auto px-4 text-center">
          <span className="badge bg-quedera-emerald/10 text-quedera-emerald mb-6">
            SENTINEL
          </span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            FIND THE RIGHT CONSULTANT
          </h1>
          <p className="text-lg text-quedera-surface max-w-2xl mx-auto mb-10">
            Search trusted consulting expertise when you need it.
          </p>
          <form
            action="/client/results"
            className="max-w-2xl mx-auto bg-quedera-surface rounded-lg p-2 flex flex-col md:flex-row gap-2"
          >
            <input
              type="text"
              name="q"
              placeholder="Search skills, expertise or sector..."
              className="flex-1 px-4 py-3 text-quedera-navy placeholder-quedera-navy/60 focus:outline-none rounded"
            />
            <Link
              href="/client/results"
              className="btn-primary px-6 py-3 whitespace-nowrap"
            >
              FIND CONSULTANTS
            </Link>
          </form>
        </div>
      </section>

      {/* Two-column pitch */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-xs font-bold text-quedera-navy/60 tracking-widest mb-2">
              FOR CLIENTS
            </h3>
            <p className="text-xl font-bold text-quedera-navy mb-3">
              Find specialist expertise.
            </p>
            <p className="text-quedera-navy/70 mb-6">
              Search verified consultants by skill, sector, experience and
              availability. Engage with confidence through a controlled contract
              workflow.
            </p>
            <Link href="/client/search" className="btn-secondary">
              Find Expertise
            </Link>
          </div>
          <div className="card">
            <h3 className="text-xs font-bold text-quedera-navy/60 tracking-widest mb-2">
              FOR CONSULTANTS
            </h3>
            <p className="text-xl font-bold text-quedera-navy mb-3">
              Build your professional profile within QUEDERA.
            </p>
            <p className="text-quedera-navy/70 mb-6">
              Set your day rate, manage availability, and receive contracting
              enquiries directly. Verified, controlled, transparent.
            </p>
            <Link href="/register/consultant" className="btn-primary">
              Register as Consultant
            </Link>
          </div>
        </div>
      </section>

      {/* Footer pitch */}
      <section className="bg-quedera-surface py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-quedera-navy mb-4">
            SENTINEL
          </h2>
          <p className="text-quedera-navy/60 max-w-2xl mx-auto">
            Secure access to trusted consulting expertise.
          </p>
        </div>
      </section>
    </div>
  );
}
