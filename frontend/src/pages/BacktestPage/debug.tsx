import React, { useState, useEffect } from 'react';
import { Card, Spin, Button, message } from 'antd';
import { backtestApi, strategiesApi, dataApi } from '../../services/api';

export const BacktestPageDebug: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Debug: Starting data fetch...');
        setLoading(true);
        setError(null);

        const [symbols, factors, tasks] = await Promise.all([
          dataApi.getSymbols('swap'),
          strategiesApi.listFactors(),
          backtestApi.listTasks()
        ]);

        console.log('Debug: Data fetched successfully', {
          symbols: symbols?.length || 0,
          factors: factors?.length || 0,
          tasks: tasks?.length || 0
        });

        setData({ symbols, factors, tasks });
      } catch (err) {
        console.error('Debug: Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card>
          <Spin size="large" tip="Loading debug page..." />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <h3>Error</h3>
          <p>{error}</p>
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Debug Information">
        <div style={{ marginBottom: '16px' }}>
          <h4>API Data Status:</h4>
          <ul>
            <li>Symbols: {data.symbols?.length || 0} items</li>
            <li>Factors: {data.factors?.length || 0} items</li>
            <li>Tasks: {data.tasks?.length || 0} items</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '16px' }}>
          <h4>Sample Data:</h4>
          <pre style={{ background: '#f5f5f5', padding: '8px', fontSize: '12px' }}>
            {JSON.stringify({
              firstSymbol: data.symbols?.[0],
              firstFactor: data.factors?.[0],
              firstTask: data.tasks?.[0]
            }, null, 2)}
          </pre>
        </div>

        <Button type="primary" onClick={() => console.log('Full data:', data)}>
          Log Full Data to Console
        </Button>
      </Card>
    </div>
  );
};
