import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, List, Typography, message, Tag } from 'antd';
import { ArrowLeftOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../services/api';

const { Title, Text } = Typography;

const ConversationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/conversations/${id}`);
      setData(response.data);
    } catch (error) {
      message.error('获取对话详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div>加载中...</div>;
  }

  const { conversation, messages } = data;

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/conversations')}
        style={{ marginBottom: 24 }}
      >
        返回
      </Button>
      
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>{conversation.title}</Title>
        <div>
          <Text type="secondary">用户: {conversation.user_nickname}</Text>
          <br />
          <Text type="secondary">
            创建时间: {dayjs(conversation.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Text>
        </div>
      </Card>

      <List
        dataSource={messages}
        renderItem={(msg) => (
          <List.Item style={{ 
            background: msg.role === 'user' ? '#f0f7ff' : '#f6ffed',
            padding: 16,
            borderRadius: 8,
            marginBottom: 16
          }}>
            <div style={{ marginBottom: 8 }}>
              {msg.role === 'user' ? (
                <Tag color="blue" icon={<UserOutlined />}>用户</Tag>
              ) : (
                <Tag color="green" icon={<RobotOutlined />}>助手</Tag>
              )}
              <Text type="secondary" style={{ marginLeft: 16, fontSize: 12 }}>
                {dayjs(msg.created_at).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </div>
            <Text>{msg.content}</Text>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ConversationDetail;
