import { Home2Regular, Book2Regular, LayersRegular, LightningRegular, ChartBarRegular, ArrowRightRegular, UploadRegular, AddRegular, FileRegular, CheckRegular, CloseRegular, MenuRegular, LeafRegular, TimeRegular } from '@mingcute/react/core-regular'

const icons = { home: Home2Regular, book: Book2Regular, layers: LayersRegular, practice: LightningRegular, progress: ChartBarRegular, arrow: ArrowRightRegular, upload: UploadRegular, plus: AddRegular, file: FileRegular, check: CheckRegular, close: CloseRegular, menu: MenuRegular, leaf: LeafRegular, clock: TimeRegular }
export default function Icon({ name, ...props }) {
  const Component = icons[name] || Book2Regular
  return <Component size={20} aria-hidden="true" focusable="false" {...props} />
}
