<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $query = Book::with(['category', 'activeRecord']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%");
            });
        }

        $books = $query->orderBy('created_at', 'desc')->paginate(10);

        $books->getCollection()->transform(function ($book) {
            $book->is_available = $book->isAvailable();
            $book->image_url    = $book->image_path
                ? Storage::disk('public')->url($book->image_path)
                : null;
            return $book;
        });

        return response()->json([
            'success' => true,
            'data'    => $books,
        ]);
    }

    public function show($id)
    {
        $book = Book::with(['category', 'activeRecord.user'])->findOrFail($id);
        $book->is_available = $book->isAvailable();
        $book->image_url    = $book->image_path
            ? Storage::disk('public')->url($book->image_path)
            : null;

        return response()->json([
            'success' => true,
            'data'    => $book,
        ]);
    }

    public function store(Request $request)
    {
        // FIX: Use array syntax so the | inside the regex is not mistaken
        // for Laravel's pipe-based rule separator.
        $request->validate([
            'title'       => 'required|string|max:255',
            'author'      => 'required|string|max:255',
            'description' => 'nullable|string',
            'isbn_no'     => ['required', 'string', 'unique:books,isbn_no', 'regex:/^(?:\d{10}|\d{13})$/'],
            'category_id' => 'required|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('books', 'public');
        }

        $book = Book::create([
            'title'       => $request->title,
            'author'      => $request->author,
            'description' => $request->description,
            'isbn_no'     => $request->isbn_no,
            'category_id' => $request->category_id,
            'image_path'  => $imagePath,
        ]);

        $book->load('category');
        $book->is_available = true;
        $book->image_url    = $book->image_path
            ? Storage::disk('public')->url($book->image_path)
            : null;

        return response()->json([
            'success' => true,
            'message' => 'Book created successfully',
            'data'    => $book,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $book = Book::findOrFail($id);

        // FIX: Use array syntax so the | inside the regex is not mistaken
        // for Laravel's pipe-based rule separator.
        $request->validate([
            'title'       => 'sometimes|required|string|max:255',
            'author'      => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'isbn_no'     => ['sometimes', 'required', 'string', 'unique:books,isbn_no,' . $id, 'regex:/^(?:\d{10}|\d{13})$/'],
            'category_id' => 'sometimes|required|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($book->image_path) {
                Storage::disk('public')->delete($book->image_path);
            }
            $book->image_path = $request->file('image')->store('books', 'public');
        }

        $book->fill($request->only(['title', 'author', 'description', 'isbn_no', 'category_id']));
        $book->save();

        $book->load('category');
        $book->is_available = $book->isAvailable();
        $book->image_url    = $book->image_path
            ? Storage::disk('public')->url($book->image_path)
            : null;

        return response()->json([
            'success' => true,
            'message' => 'Book updated successfully',
            'data'    => $book,
        ]);
    }

    public function destroy($id)
    {
        $book = Book::findOrFail($id);

        if (!$book->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete a book that is currently borrowed',
            ], 422);
        }

        if ($book->image_path) {
            Storage::disk('public')->delete($book->image_path);
        }

        $book->delete();

        return response()->json([
            'success' => true,
            'message' => 'Book deleted successfully',
        ]);
    }

    public function categories()
    {
        $categories = Category::orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data'    => $categories,
        ]);
    }
}