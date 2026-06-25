import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { CATEGORIES, CategorySlug } from '@/lib/categories';
import NotFound from './NotFound';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  if (slug === 'discovery') return <Navigate to="/discovery" replace />;

  const category = slug ? CATEGORIES[slug as CategorySlug] : null;
  if (!category) return <NotFound />;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <header className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
          {category.title}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {category.subtitle}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {category.features.map(f => (
          <button
            key={f.route}
            onClick={() => navigate(f.route)}
            className="group rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <span className="text-[64px] leading-none" aria-hidden>
                {f.icon}
              </span>
              <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
