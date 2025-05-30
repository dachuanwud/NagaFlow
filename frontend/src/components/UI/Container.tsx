import React from 'react';
import styled from 'styled-components';
import { designTokens, getThemeColors } from '../../styles/designSystem';
import { useThemeStore } from '../../stores/themeStore';

// 页面容器组件
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const StyledPageContainer = styled.div<{
  $isDark: boolean;
  $maxWidth: string;
  $padding: string;
}>`
  width: 100%;
  max-width: ${({ $maxWidth }) => {
    const maxWidths = {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      full: '100%',
    };
    return maxWidths[$maxWidth as keyof typeof maxWidths];
  }};
  margin: 0 auto;
  padding: ${({ $padding }) => {
    const paddings = {
      none: '0',
      sm: designTokens.spacing.lg,
      md: designTokens.spacing['2xl'],
      lg: designTokens.spacing['3xl'],
      xl: designTokens.spacing['4xl'],
    };
    return paddings[$padding as keyof typeof paddings];
  }};
  background: ${({ $isDark }) => {
    const colors = getThemeColors($isDark);
    return colors.bg.primary;
  }};
  border-radius: ${designTokens.borderRadius.xl};
  box-shadow: ${({ $isDark }) => 
    $isDark ? designTokens.shadowsDark.lg : designTokens.shadows.lg
  };
  transition: all ${designTokens.animation.duration.normal} ${designTokens.animation.easing.ease};
  
  ${designTokens.breakpoints.md} {
    padding: ${({ $padding }) => {
      const mobilePaddings = {
        none: '0',
        sm: designTokens.spacing.md,
        md: designTokens.spacing.lg,
        lg: designTokens.spacing.xl,
        xl: designTokens.spacing['2xl'],
      };
      return mobilePaddings[$padding as keyof typeof mobilePaddings];
    }};
  }
`;

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
}) => {
  const { isDark } = useThemeStore();

  return (
    <StyledPageContainer
      className={className}
      $isDark={isDark}
      $maxWidth={maxWidth}
      $padding={padding}
    >
      {children}
    </StyledPageContainer>
  );
};

// 卡片容器组件
interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const StyledCardContainer = styled.div<{
  $isDark: boolean;
  $padding: string;
  $shadow: string;
  $hover: boolean;
}>`
  background: ${({ $isDark }) => {
    const colors = getThemeColors($isDark);
    return colors.bg.secondary;
  }};
  border: 1px solid ${({ $isDark }) => {
    const colors = getThemeColors($isDark);
    return colors.border.primary;
  }};
  border-radius: ${designTokens.borderRadius.xl};
  padding: ${({ $padding }) => {
    const paddings = {
      none: '0',
      sm: designTokens.spacing.lg,
      md: designTokens.spacing['2xl'],
      lg: designTokens.spacing['3xl'],
    };
    return paddings[$padding as keyof typeof paddings];
  }};
  box-shadow: ${({ $isDark, $shadow }) => {
    const shadows = $isDark ? designTokens.shadowsDark : designTokens.shadows;
    return shadows[$shadow as keyof typeof shadows];
  }};
  transition: all ${designTokens.animation.duration.normal} ${designTokens.animation.easing.ease};
  
  ${({ $hover }) => $hover && `
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${designTokens.shadows.xl};
    }
  `}
`;

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  hover = false,
}) => {
  const { isDark } = useThemeStore();

  return (
    <StyledCardContainer
      className={className}
      $isDark={isDark}
      $padding={padding}
      $shadow={shadow}
      $hover={hover}
    >
      {children}
    </StyledCardContainer>
  );
};

// 网格容器组件
interface GridContainerProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const StyledGridContainer = styled.div<{
  $columns: number;
  $gap: string;
  $responsive: boolean;
}>`
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns}, 1fr);
  gap: ${({ $gap }) => {
    const gaps = {
      sm: designTokens.spacing.lg,
      md: designTokens.spacing['2xl'],
      lg: designTokens.spacing['3xl'],
      xl: designTokens.spacing['4xl'],
    };
    return gaps[$gap as keyof typeof gaps];
  }};
  
  ${({ $responsive, $columns }) => $responsive && `
    @media (max-width: ${designTokens.breakpoints.lg}) {
      grid-template-columns: repeat(${Math.min($columns, 2)}, 1fr);
    }
    
    @media (max-width: ${designTokens.breakpoints.md}) {
      grid-template-columns: 1fr;
    }
  `}
`;

export const GridContainer: React.FC<GridContainerProps> = ({
  children,
  className,
  columns = 1,
  gap = 'md',
  responsive = true,
}) => {
  return (
    <StyledGridContainer
      className={className}
      $columns={columns}
      $gap={gap}
      $responsive={responsive}
    >
      {children}
    </StyledGridContainer>
  );
};

// Flex 容器组件
interface FlexContainerProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'row' | 'column';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
}

const StyledFlexContainer = styled.div<{
  $direction: string;
  $justify: string;
  $align: string;
  $gap: string;
  $wrap: boolean;
}>`
  display: flex;
  flex-direction: ${({ $direction }) => $direction};
  justify-content: ${({ $justify }) => {
    const justifyMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    };
    return justifyMap[$justify as keyof typeof justifyMap];
  }};
  align-items: ${({ $align }) => {
    const alignMap = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    return alignMap[$align as keyof typeof alignMap];
  }};
  gap: ${({ $gap }) => {
    const gaps = {
      sm: designTokens.spacing.lg,
      md: designTokens.spacing['2xl'],
      lg: designTokens.spacing['3xl'],
      xl: designTokens.spacing['4xl'],
    };
    return gaps[$gap as keyof typeof gaps];
  }};
  flex-wrap: ${({ $wrap }) => $wrap ? 'wrap' : 'nowrap'};
`;

export const FlexContainer: React.FC<FlexContainerProps> = ({
  children,
  className,
  direction = 'row',
  justify = 'start',
  align = 'start',
  gap = 'md',
  wrap = false,
}) => {
  return (
    <StyledFlexContainer
      className={className}
      $direction={direction}
      $justify={justify}
      $align={align}
      $gap={gap}
      $wrap={wrap}
    >
      {children}
    </StyledFlexContainer>
  );
};
