import { cn } from '@/lib/utils';

interface ProductIconProps {
  emoji?: string | null;
  logoUrl?: string | null;
  name?: string;
  size?: number;
  emojiClassName?: string;
  className?: string;
}

/**
 * Renders the product logo image if available, otherwise the emoji.
 */
const ProductIcon = ({
  emoji,
  logoUrl,
  name = '',
  size = 40,
  emojiClassName,
  className,
}: ProductIconProps) => {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover shrink-0', className)}
      />
    );
  }
  return (
    <span className={cn('leading-none inline-flex items-center justify-center shrink-0', emojiClassName, className)}>
      {emoji || '📦'}
    </span>
  );
};

export default ProductIcon;
