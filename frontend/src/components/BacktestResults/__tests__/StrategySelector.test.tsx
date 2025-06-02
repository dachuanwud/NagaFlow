import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { StrategySelector } from '../StrategySelector';
import { useBacktestResultsStore } from '../../../stores/backtestResultsStore';

// Mock the store
jest.mock('../../../stores/backtestResultsStore');
jest.mock('../../../stores/themeStore', () => ({
  useThemeStore: () => ({ isDark: false })
}));

const mockUseBacktestResultsStore = useBacktestResultsStore as jest.MockedFunction<typeof useBacktestResultsStore>;

const mockTasks = [
  {
    task_id: 'task1',
    status: 'completed',
    progress: 100,
    message: 'Completed',
    symbols_total: 1,
    symbols_completed: 1,
    results: [
      {
        task_id: 'task1',
        symbol: 'BTCUSDT',
        strategy: 'MA_Cross',
        parameters: {},
        final_return: 15.23,
        annual_return: 12.45,
        max_drawdown: -8.67,
        sharpe_ratio: 1.24,
        win_rate: 65.4,
        total_trades: 156,
        profit_factor: 1.85,
        volatility: 18.9,
        created_at: '2024-01-01T00:00:00Z',
        equity_curve: [],
        drawdown_periods: [],
        monthly_returns: [],
        trade_records: []
      }
    ]
  },
  {
    task_id: 'task2',
    status: 'completed',
    progress: 100,
    message: 'Completed',
    symbols_total: 1,
    symbols_completed: 1,
    results: [
      {
        task_id: 'task2',
        symbol: 'ETHUSDT',
        strategy: 'RSI_Strategy',
        parameters: {},
        final_return: -5.12,
        annual_return: -3.45,
        max_drawdown: -12.34,
        sharpe_ratio: 0.85,
        win_rate: 45.2,
        total_trades: 89,
        profit_factor: 0.92,
        volatility: 22.1,
        created_at: '2024-01-02T00:00:00Z',
        equity_curve: [],
        drawdown_periods: [],
        monthly_returns: [],
        trade_records: []
      }
    ]
  }
];

const defaultStoreState = {
  tasks: mockTasks,
  results: mockTasks.flatMap(t => t.results || []),
  selectedTaskId: null,
  compareMode: false,
  compareTaskIds: [],
  selectTask: jest.fn(),
  clearSelection: jest.fn(),
  toggleCompareMode: jest.fn(),
  addToCompare: jest.fn(),
  removeFromCompare: jest.fn(),
  clearCompare: jest.fn()
};

describe('StrategySelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBacktestResultsStore.mockReturnValue(defaultStoreState as any);
  });

  const renderComponent = (props = {}) => {
    return render(
      <ConfigProvider locale={zhCN}>
        <StrategySelector {...props} />
      </ConfigProvider>
    );
  };

  test('renders strategy selector with completed tasks', () => {
    renderComponent();
    
    expect(screen.getByText('策略选择器')).toBeInTheDocument();
    expect(screen.getByText('2 个策略')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请选择一个策略查看详细结果')).toBeInTheDocument();
  });

  test('displays empty state when no completed tasks', () => {
    mockUseBacktestResultsStore.mockReturnValue({
      ...defaultStoreState,
      tasks: [],
      results: []
    } as any);

    renderComponent();
    
    expect(screen.getByText('暂无已完成的回测策略')).toBeInTheDocument();
  });

  test('calls selectTask when strategy is selected', () => {
    const mockSelectTask = jest.fn();
    mockUseBacktestResultsStore.mockReturnValue({
      ...defaultStoreState,
      selectTask: mockSelectTask
    } as any);

    renderComponent();
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    const option = screen.getByText('MA_Cross - BTCUSDT');
    fireEvent.click(option);
    
    expect(mockSelectTask).toHaveBeenCalledWith('task1');
  });

  test('shows compare mode panel when compare mode is enabled', () => {
    mockUseBacktestResultsStore.mockReturnValue({
      ...defaultStoreState,
      compareMode: true
    } as any);

    renderComponent();
    
    expect(screen.getByText('对比策略 (最多4个)：')).toBeInTheDocument();
  });

  test('calls toggleCompareMode when compare button is clicked', () => {
    const mockToggleCompareMode = jest.fn();
    mockUseBacktestResultsStore.mockReturnValue({
      ...defaultStoreState,
      toggleCompareMode: mockToggleCompareMode
    } as any);

    renderComponent();
    
    const compareButton = screen.getByText('对比');
    fireEvent.click(compareButton);
    
    expect(mockToggleCompareMode).toHaveBeenCalled();
  });

  test('calls clearSelection when clear button is clicked', () => {
    const mockClearSelection = jest.fn();
    mockUseBacktestResultsStore.mockReturnValue({
      ...defaultStoreState,
      selectedTaskId: 'task1',
      clearSelection: mockClearSelection
    } as any);

    renderComponent();
    
    const clearButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(clearButton);
    
    expect(mockClearSelection).toHaveBeenCalled();
  });

  test('calls onStrategyChange callback when provided', () => {
    const mockOnStrategyChange = jest.fn();
    const mockSelectTask = jest.fn();
    
    mockUseBacktestResultsStore.mockReturnValue({
      ...defaultStoreState,
      selectTask: mockSelectTask
    } as any);

    renderComponent({ onStrategyChange: mockOnStrategyChange });
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    const option = screen.getByText('MA_Cross - BTCUSDT');
    fireEvent.click(option);
    
    expect(mockOnStrategyChange).toHaveBeenCalledWith('task1');
  });
});
