import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithIntl, screen, fireEvent } from '@/test/utils'
import { ClassesFilterBar } from '@/components/ClassesFilterBar'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/en/classes',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Radix Select as a native <select> for testability in jsdom
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => {
    // Extract items from children to build a native select
    return (
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        data-testid="mock-select"
      >
        {children}
      </select>
    )
  },
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}))

const classesMessages = {
  classes: {
    allTeachers: 'All Teachers',
    allTypes: 'All Types',
    filterByTeacher: 'Filter by teacher',
    filterByType: 'Filter by type',
    noMatchingClasses: 'No classes match your filters.',
  },
}

const mockTeachers = [
  { id: 't1', label: 'Sarah Johnson' },
  { id: 't2', label: 'Michael Chen' },
]

const mockYogaTypes = [
  { id: 'yt1', label: 'Hatha Yoga' },
  { id: 'yt2', label: 'Vinyasa Yoga' },
]

describe('ClassesFilterBar', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders teacher and type dropdowns with "all" options', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
      />,
      { messages: classesMessages }
    )

    expect(screen.getByText('All Teachers')).toBeInTheDocument()
    expect(screen.getByText('All Types')).toBeInTheDocument()
  })

  it('renders all teacher options', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
      />,
      { messages: classesMessages }
    )

    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    expect(screen.getByText('Michael Chen')).toBeInTheDocument()
  })

  it('renders all yoga type options', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
      />,
      { messages: classesMessages }
    )

    expect(screen.getByText('Hatha Yoga')).toBeInTheDocument()
    expect(screen.getByText('Vinyasa Yoga')).toBeInTheDocument()
  })

  it('navigates with teacher filter when teacher is selected', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
      />,
      { messages: classesMessages }
    )

    const selects = screen.getAllByTestId('mock-select')
    // First select is teacher, second is type
    fireEvent.change(selects[0], { target: { value: 't1' } })

    expect(mockPush).toHaveBeenCalledWith('/en/classes?teacher=t1')
  })

  it('navigates with type filter when type is selected', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
      />,
      { messages: classesMessages }
    )

    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[1], { target: { value: 'yt1' } })

    expect(mockPush).toHaveBeenCalledWith('/en/classes?type=yt1')
  })

  it('removes teacher filter when "all" is selected', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
        initialTeacher="t1"
      />,
      { messages: classesMessages }
    )

    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[0], { target: { value: 'all' } })

    expect(mockPush).toHaveBeenCalledWith('/en/classes')
  })

  it('removes type filter when "all" is selected', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={mockTeachers}
        yogaTypes={mockYogaTypes}
        initialType="yt2"
      />,
      { messages: classesMessages }
    )

    const selects = screen.getAllByTestId('mock-select')
    fireEvent.change(selects[1], { target: { value: 'all' } })

    expect(mockPush).toHaveBeenCalledWith('/en/classes')
  })

  it('renders with empty teacher and type lists', () => {
    renderWithIntl(
      <ClassesFilterBar
        teachers={[]}
        yogaTypes={[]}
      />,
      { messages: classesMessages }
    )

    expect(screen.getByText('All Teachers')).toBeInTheDocument()
    expect(screen.getByText('All Types')).toBeInTheDocument()
  })
})
