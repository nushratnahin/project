<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Record;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function stats()
    {
        $totalBooks    = Book::count();
        $totalUsers    = User::where('type', 'member')->count();
        $borrowed      = Record::whereNull('returned_at')->count();
        $overdue       = Record::whereNull('returned_at')
            ->where('due_date', '<', Carbon::now())
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'total_books'      => $totalBooks,
                'total_users'      => $totalUsers,
                'borrowed_books'   => $borrowed,
                'overdue_books'    => $overdue,
            ],
        ]);
    }

    public function users(Request $request)
    {
        $query = User::withTrashed()->where('type', 'member');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $users,
        ]);
    }

    public function updateUserStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,suspended',
        ]);

        $user = User::findOrFail($id);

        if ($user->type === 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot modify admin status.',
            ], 403);
        }

        $user->status = $request->status;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User status updated to ' . $request->status,
            'data'    => $user,
        ]);
    }
}
