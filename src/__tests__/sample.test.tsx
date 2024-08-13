// src/__tests__/sample.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

const SampleComponent = () => <div>Hello, World!</div>

describe('Sample Component', () => {
  it('renders without crashing', () => {
    render(<SampleComponent />)
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })
})