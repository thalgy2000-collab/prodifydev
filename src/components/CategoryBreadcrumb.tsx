import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getCategoryByRoute, getFeatureByRoute } from '@/lib/categories';

export function CategoryBreadcrumb() {
  const { pathname } = useLocation();
  const category = getCategoryByRoute(pathname);
  const feature = getFeatureByRoute(pathname);

  if (!category || !feature) return null;

  return (
    <nav
      aria-label="breadcrumb"
      className="px-6 md:px-8 pt-4 text-sm text-muted-foreground flex items-center gap-1.5"
    >
      <Link
        to={`/categoria/${category.slug}`}
        className="hover:text-foreground transition-colors"
      >
        {category.title}
      </Link>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="text-foreground font-medium">{feature.title}</span>
    </nav>
  );
}
