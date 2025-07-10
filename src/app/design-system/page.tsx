import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Input,
  Badge,
  Avatar,
  Progress,
  CircularProgress,
  Skeleton,
  Modal,
  useToast,
} from '@/components/ui';

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-4xl font-bold">Design System Showcase</h1>
        <p className="text-muted-foreground">
          Preview of all UI components in the Cursor Time Tracker design system.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="timer">Timer</Button>
              <Button variant="timer-break">Break</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button leftIcon="🔥">With Icon</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Form inputs with different states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Default input" />
            <Input placeholder="Timer input" variant="timer" />
            <Input placeholder="Search input" variant="search" />
            <Input 
              placeholder="Input with error" 
              error="This field is required"
              state="error"
            />
            <Input 
              placeholder="Input with helper text" 
              helperText="This is some helpful information"
            />
            <Input 
              label="Labeled Input"
              placeholder="Enter your name"
            />
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Cards</CardTitle>
            <CardDescription>Different card variants</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card variant="default">
              <CardContent className="p-4">
                <h3 className="font-semibold">Default Card</h3>
                <p className="text-sm text-muted-foreground">Basic card variant</p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="p-4">
                <h3 className="font-semibold">Elevated Card</h3>
                <p className="text-sm text-muted-foreground">Card with shadow</p>
              </CardContent>
            </Card>
            <Card variant="interactive">
              <CardContent className="p-4">
                <h3 className="font-semibold">Interactive Card</h3>
                <p className="text-sm text-muted-foreground">Hover to see effect</p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="timer">Work Session</Badge>
              <Badge variant="timer-break">Break Time</Badge>
              <Badge variant="timer-focus">Focus Mode</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Avatars */}
        <Card>
          <CardHeader>
            <CardTitle>Avatars</CardTitle>
            <CardDescription>User profile pictures and initials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar size="sm" name="John Doe" />
              <Avatar size="default" name="Jane Smith" />
              <Avatar size="lg" name="Bob Wilson" />
              <Avatar size="xl" name="Alice Brown" />
              <Avatar size="2xl" name="Charlie Davis" />
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Indicators</CardTitle>
            <CardDescription>Linear and circular progress bars</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Progress value={25} showLabel label="Project Progress" />
              <Progress value={50} variant="timer" showLabel label="Timer Progress" />
              <Progress value={75} size="lg" showLabel label="Overall Progress" />
            </div>
            <div className="flex items-center gap-6">
              <CircularProgress value={30} size={80} />
              <CircularProgress value={60} size={100} />
              <CircularProgress value={90} size={120} />
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Skeleton components for loading</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton variant="heading" className="w-1/3" />
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="text" className="w-4/5" />
              <Skeleton variant="text" className="w-3/5" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton variant="avatar" className="h-12 w-12" />
              <div className="space-y-2 flex-1">
                <Skeleton variant="text" className="w-1/3" />
                <Skeleton variant="text" className="w-2/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
