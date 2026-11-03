interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, badge, action }: PageHeaderProps) {
  return (
    <div className="border-b border-quedera-surface py-8 mb-8 bg-quedera-surface">
      <div className="container mx-auto px-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-quedera-navy">{title}</h1>
            {badge && (
              <span className="badge bg-quedera-emerald/10 text-quedera-emerald">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-quedera-navy/50 mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
