<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Record;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class RecordController extends Controller
{
    public function myBooks(Request $request)
    {
        $user = $request->user();

        $current = Record::with('book.category')
            ->where('user_id', $user->id)
            ->whereNull('returned_at')
            ->orderBy('borrowed_at', 'desc')
            ->get()
            ->map(function ($record) {
                $record->book->image_url = $record->book->image_path
                    ? Storage::disk('public')->url($record->book->image_path)
                    : null;
                $record->is_overdue = $record->isOverdue();
                return $record;
            });

        $history = Record::with('book.category')
            ->where('user_id', $user->id)
            ->whereNotNull('returned_at')
            ->orderBy('returned_at', 'desc')
            ->get()
            ->map(function ($record) {
                $record->book->image_url = $record->book->image_path
                    ? Storage::disk('public')->url($record->book->image_path)
                    : null;
                return $record;
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'current' => $current,
                'history' => $history,
            ],
        ]);
    }

    public function borrow(Request $request, $bookId)
    {
        $user = $request->user();
        $book = Book::findOrFail($bookId);

        // Check user borrow limit
        $activeCount = Record::where('user_id', $user->id)
            ->whereNull('returned_at')
            ->count();

        if ($activeCount >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'You have reached the maximum borrow limit of 3 books.',
            ], 422);
        }

        // Check book availability
        if (!$book->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'This book is currently not available.',
            ], 422);
        }

        $now     = Carbon::now();
        $dueDate = $now->copy()->addDays(14);

        $record = Record::create([
            'user_id'     => $user->id,
            'book_id'     => $book->id,
            'borrowed_at' => $now,
            'due_date'    => $dueDate,
            'returned_at' => null,
        ]);

        $record->load('book.category');

        return response()->json([
            'success' => true,
            'message' => 'Book borrowed successfully. Due date: ' . $dueDate->format('d M Y'),
            'data'    => $record,
        ], 201);
    }

    public function return(Request $request, $recordId)
    {
        $user   = $request->user();
        $record = Record::where('id', $recordId)
            ->where('user_id', $user->id)
            ->whereNull('returned_at')
            ->firstOrFail();

        $record->returned_at = Carbon::now();
        $record->save();

        return response()->json([
            'success' => true,
            'message' => 'Book returned successfully.',
            'data'    => $record,
        ]);
    }
}
