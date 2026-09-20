import { User, Loader2 } from 'lucide-react';
import formatCategory from '../../utils/formatCategory';
import { formatPosition } from '../../utils/format';

interface Staff {
  id: number;
  name: string;
  position?: string;
}

interface StaffSelectorProps {
  staffList: Staff[];
  selectedStaff: Staff | null;
  onSelectStaff: (staff: Staff) => void;
  loading?: boolean;
  service?: { name: string; category: string };
}

export default function StaffSelector({
  staffList,
  selectedStaff,
  onSelectStaff,
  loading = false,
  service,
}: StaffSelectorProps) {
  const initials = (name: string) => {
    const [first = '', last = ''] = name.split(' ');
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Choose a Specialist</h3>
          {service && (
            <p className="text-xs text-neutral-400 mt-0.5">
              Available for {service.name} ({formatCategory(service.category)})
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-neutral-400">
          <Loader2 size={20} className="animate-spin mr-2" /> Checking available staff...
        </div>
      ) : staffList.length === 0 ? (
        <div className="border border-neutral-200 rounded-md p-8 text-center">
          <User size={28} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-sm font-medium text-neutral-700">No staff available</p>
          <p className="text-xs text-neutral-400 mt-1">Try selecting a different date.</p>
        </div>
      ) : staffList.length === 1 ? (
        <button
          type="button"
          onClick={() => onSelectStaff(staffList[0])}
          className={`w-full flex items-center gap-4 p-4 rounded-md border transition text-left ${
            selectedStaff?.id === staffList[0].id
              ? 'bg-neutral-900 border-neutral-900 text-white'
              : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            selectedStaff?.id === staffList[0].id ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
          }`}>
            <span className="text-sm font-medium">{initials(staffList[0].name)}</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{staffList[0].name}</p>
            <p className={`text-xs ${selectedStaff?.id === staffList[0].id ? 'text-neutral-300' : 'text-neutral-400'}`}>
              Only specialist assigned to this service
            </p>
          </div>
          {selectedStaff?.id === staffList[0].id && (
            <span className="text-xs font-medium text-amber-400">Selected</span>
          )}
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {staffList.map((staff) => {
            const isSelected = selectedStaff?.id === staff.id;
            return (
              <button
                key={staff.id}
                type="button"
                onClick={() => onSelectStaff(staff)}
                className={`flex items-center gap-3 p-4 rounded-md border transition text-left ${
                  isSelected
                    ? 'bg-neutral-900 border-neutral-900 text-white'
                    : 'bg-white border-neutral-200 text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  <span className="text-sm font-medium">{initials(staff.name)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{staff.name}</p>
                  {staff.position && (
                    <p className={`text-xs ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                      {formatPosition(staff.position)}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}