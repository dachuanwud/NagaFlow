import React from 'react';
import styled from 'styled-components';
import { designTokens, getThemeColors } from '../../styles/designSystem';
import { useThemeStore } from '../../stores/themeStore';

// 标题组件
interface HeadingProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

const StyledHeading = styled.h1<{
  $level: number;
  $color: string;
  $weight: string;
  $isDark: boolean;
}>`
  font-family: ${designTokens.typography.fontFamily.primary};
  font-size: ${({ $level }) => {
    const sizes = {
      1: designTokens.typography.fontSize['4xl'],
      2: designTokens.typography.fontSize['3xl'],
      3: designTokens.typography.fontSize['2xl'],
      4: designTokens.typography.fontSize.xl,
      5: designTokens.typography.fontSize.lg,
      6: designTokens.typography.fontSize.md,
    };
    return sizes[$level as keyof typeof sizes];
  }};
  font-weight: ${({ $weight }) => 
    designTokens.typography.fontWeight[$weight as keyof typeof designTokens.typography.fontWeight]
  };
  line-height: ${designTokens.typography.lineHeight.tight};
  color: ${({ $isDark, $color }) => {
    const colors = getThemeColors($isDark);
    const colorMap = {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      tertiary: colors.text.tertiary,
      accent: designTokens.colors.primary[500],
    };
    return colorMap[$color as keyof typeof colorMap];
  }};
  margin: 0 0 ${designTokens.spacing.lg} 0;
  
  @media (max-width: ${designTokens.breakpoints.md}) {
    font-size: ${({ $level }) => {
      const mobileSizes = {
        1: designTokens.typography.fontSize['3xl'],
        2: designTokens.typography.fontSize['2xl'],
        3: designTokens.typography.fontSize.xl,
        4: designTokens.typography.fontSize.lg,
        5: designTokens.typography.fontSize.md,
        6: designTokens.typography.fontSize.sm,
      };
      return mobileSizes[$level as keyof typeof mobileSizes];
    }};
  }
`;

export const Heading: React.FC<HeadingProps> = ({
  children,
  level = 1,
  color = 'primary',
  weight = 'semibold',
  className,
}) => {
  const { isDark } = useThemeStore();
  
  return (
    <StyledHeading
      as={`h${level}` as any}
      $level={level}
      $color={color}
      $weight={weight}
      $isDark={isDark}
      className={className}
    >
      {children}
    </StyledHeading>
  );
};

// 文本组件
interface TextProps {
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'success' | 'error' | 'warning';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  align?: 'left' | 'center' | 'right';
  className?: string;
  as?: 'p' | 'span' | 'div';
}

const StyledText = styled.p<{
  $size: string;
  $color: string;
  $weight: string;
  $align: string;
  $isDark: boolean;
}>`
  font-family: ${designTokens.typography.fontFamily.primary};
  font-size: ${({ $size }) => 
    designTokens.typography.fontSize[$size as keyof typeof designTokens.typography.fontSize]
  };
  font-weight: ${({ $weight }) => 
    designTokens.typography.fontWeight[$weight as keyof typeof designTokens.typography.fontWeight]
  };
  line-height: ${designTokens.typography.lineHeight.normal};
  text-align: ${({ $align }) => $align};
  color: ${({ $isDark, $color }) => {
    const colors = getThemeColors($isDark);
    const colorMap = {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
      tertiary: colors.text.tertiary,
      accent: designTokens.colors.primary[500],
      success: designTokens.colors.success[500],
      error: designTokens.colors.error[500],
      warning: designTokens.colors.warning[500],
    };
    return colorMap[$color as keyof typeof colorMap];
  }};
  margin: 0 0 ${designTokens.spacing.md} 0;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const Text: React.FC<TextProps> = ({
  children,
  size = 'md',
  color = 'primary',
  weight = 'normal',
  align = 'left',
  className,
  as = 'p',
}) => {
  const { isDark } = useThemeStore();
  
  return (
    <StyledText
      as={as}
      $size={size}
      $color={color}
      $weight={weight}
      $align={align}
      $isDark={isDark}
      className={className}
    >
      {children}
    </StyledText>
  );
};

// 代码文本组件
interface CodeProps {
  children: React.ReactNode;
  inline?: boolean;
  className?: string;
}

const StyledCode = styled.code<{
  $inline: boolean;
  $isDark: boolean;
}>`
  font-family: ${designTokens.typography.fontFamily.mono};
  font-size: ${({ $inline }) => 
    $inline ? designTokens.typography.fontSize.sm : designTokens.typography.fontSize.md
  };
  background: ${({ $isDark }) => {
    const colors = getThemeColors($isDark);
    return colors.bg.tertiary;
  }};
  color: ${({ $isDark }) => {
    const colors = getThemeColors($isDark);
    return colors.text.primary;
  }};
  border: 1px solid ${({ $isDark }) => {
    const colors = getThemeColors($isDark);
    return colors.border.secondary;
  }};
  border-radius: ${designTokens.borderRadius.md};
  padding: ${({ $inline }) => 
    $inline ? `${designTokens.spacing.xs} ${designTokens.spacing.sm}` : designTokens.spacing.lg
  };
  ${({ $inline }) => !$inline && `
    display: block;
    white-space: pre-wrap;
    overflow-x: auto;
  `}
`;

export const Code: React.FC<CodeProps> = ({
  children,
  inline = false,
  className,
}) => {
  const { isDark } = useThemeStore();
  
  return (
    <StyledCode
      $inline={inline}
      $isDark={isDark}
      className={className}
    >
      {children}
    </StyledCode>
  );
};

// 链接组件
interface LinkProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color?: 'primary' | 'secondary' | 'accent';
  underline?: boolean;
  className?: string;
}

const StyledLink = styled.a<{
  $color: string;
  $underline: boolean;
  $isDark: boolean;
}>`
  font-family: ${designTokens.typography.fontFamily.primary};
  color: ${({ $isDark, $color }) => {
    const colors = getThemeColors($isDark);
    const colorMap = {
      primary: designTokens.colors.primary[500],
      secondary: colors.text.secondary,
      accent: designTokens.colors.primary[400],
    };
    return colorMap[$color as keyof typeof colorMap];
  }};
  text-decoration: ${({ $underline }) => $underline ? 'underline' : 'none'};
  cursor: pointer;
  transition: all ${designTokens.animation.duration.fast} ${designTokens.animation.easing.ease};
  
  &:hover {
    color: ${({ $color }) => {
      const colorMap = {
        primary: designTokens.colors.primary[400],
        secondary: designTokens.colors.primary[500],
        accent: designTokens.colors.primary[300],
      };
      return colorMap[$color as keyof typeof colorMap];
    }};
    text-decoration: underline;
  }
  
  &:focus {
    outline: 2px solid ${designTokens.colors.primary[500]};
    outline-offset: 2px;
  }
`;

export const Link: React.FC<LinkProps> = ({
  children,
  href,
  onClick,
  color = 'primary',
  underline = false,
  className,
}) => {
  const { isDark } = useThemeStore();
  
  return (
    <StyledLink
      href={href}
      onClick={onClick}
      $color={color}
      $underline={underline}
      $isDark={isDark}
      className={className}
    >
      {children}
    </StyledLink>
  );
};
