import { Search } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

/** Plain GET form: works without client JS, keeps the query in ?q= */
export function SearchForm({ defaultValue, placeholder }: { defaultValue?: string; placeholder: string }) {
  return (
    <form className="w-full sm:max-w-xs">
      <InputGroup className="bg-background">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput type="search" name="q" defaultValue={defaultValue} placeholder={placeholder} />
      </InputGroup>
    </form>
  )
}
