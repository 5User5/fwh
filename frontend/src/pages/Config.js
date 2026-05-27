import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Card, message } from 'antd';
import { api } from '../services/api';

const Config = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/config');
      form.setFieldsValue(response.data);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await api.put('/admin/config', values);
      message.success('配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统配置</h2>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            model_timeout: 30,
            enable_domain_detection: true,
          }}
        >
          <Form.Item
            label="模型 API 地址"
            name="model_api_url"
            rules={[{ required: true, message: '请输入模型 API 地址' }]}
          >
            <Input placeholder="http://localhost:8000/v1/chat/completions" />
          </Form.Item>

          <Form.Item
            label="模型 API Key"
            name="model_api_key"
          >
            <Input.Password placeholder="请输入 API Key" />
          </Form.Item>

          <Form.Item
            label="超时时间 (秒)"
            name="model_timeout"
            rules={[{ required: true, message: '请输入超时时间' }]}
          >
            <InputNumber min={1} max={300} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            label="启用领域检测"
            name="enable_domain_detection"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="默认领域"
            name="default_domain"
          >
            <Input placeholder="general" />
          </Form.Item>

          <Form.Item
            label="系统提示词"
            name="system_prompt"
          >
            <Input.TextArea rows={4} placeholder="你是一个乐于助人的AI助手。" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Config;
