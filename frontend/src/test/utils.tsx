import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import userEvent from '@testing-library/user-event'

// Basic English messages for testing
const defaultEnMessages = {
  nav: {
    home: 'Home',
    classes: 'Classes',
    teachers: 'Teachers',
    yogaTypes: 'Yoga Types',
    register: 'Register'
  },
  home: {
    title: 'Welcome to enjoyyoga'
  },
  admin: {
    dashboard: 'Dashboard',
    teachers: 'Teachers',
    registrations: 'Registrations',
    inquiries: 'Inquiries',
    logout: 'Logout'
  },
  contact: {
    title: 'Contact Us',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    subject: 'Subject',
    message: 'Message',
    category: 'Category',
    submit: 'Submit',
    success: 'Message sent successfully!',
    error: 'Failed to send message. Please try again.'
  },
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add'
  }
}

// Basic Chinese messages for testing
const defaultZhMessages = {
  nav: {
    home: '首页',
    classes: '课程',
    teachers: '教师',
    yogaTypes: '瑜伽类型',
    register: '注册'
  },
  home: {
    title: '欢迎来到enjoyyoga'
  },
  admin: {
    dashboard: '仪表板',
    teachers: '教师',
    registrations: '注册',
    inquiries: '询问',
    logout: '登出'
  },
  contact: {
    title: '联系我们',
    name: '姓名',
    email: '邮箱',
    phone: '电话',
    subject: '主题',
    message: '消息',
    category: '类别',
    submit: '提交',
    success: '消息发送成功！',
    error: '发送消息失败。请重试。'
  },
  common: {
    loading: '加载中...',
    error: '错误',
    success: '成功',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    add: '添加'
  }
}

interface RenderWithIntlOptions extends Omit<RenderOptions, 'wrapper'> {
  locale?: 'en' | 'zh'
  messages?: Record<string, any>
}

/**
 * Custom render function that includes NextIntlClientProvider
 */
export function renderWithIntl(
  ui: React.ReactElement,
  options: RenderWithIntlOptions = {}
) {
  const {
    locale = 'en',
    messages = locale === 'zh' ? defaultZhMessages : defaultEnMessages,
    ...renderOptions
  } = options

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}

// Export commonly used messages for individual test customization
export { defaultEnMessages, defaultZhMessages }

// Re-export everything from @testing-library/react
export * from '@testing-library/react'