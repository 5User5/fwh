import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Typography, message } from 'antd';
import { 
  UserOutlined, 
  MessageOutlined, 
  CommentOutlined, 
  CalendarOutlined,
  ArrowRightOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../services/api';

const { Text } = Typography;

const Stats = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/stats');
      setData(response.data);
    } catch (error) {
      message.error('获取统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统统计</h2>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={data.total_users}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总对话数"
              value={data.total_conversations}
              prefix={<CommentOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总消息数"
              value={data.total_messages}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日对话"
              value={data.today_conversations}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近对话" style={{ marginBottom: 24 }}>
        <List
          dataSource={data.recent_conversations}
          renderItem={(item) => (
            <List.Item
              actions={[
                <a key="view" onClick={() => navigate(`/conversations/${item.id}`)}>
                  查看 <ArrowRightOutlined />
                </a>
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={
                  <div>
                    <Text type="secondary">{item.user_nickname}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.created_at).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Stats;
