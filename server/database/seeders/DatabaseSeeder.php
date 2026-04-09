<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────
        User::firstOrCreate(
            ['email' => 'admin@library.com'],
            [
                'name'     => 'Library Admin',
                'password' => Hash::make('Admin@1234'),
                'type'     => 'admin',
                'status'   => 'active',
            ]
        );

        // ── Demo Member ───────────────────────────────────
        User::firstOrCreate(
            ['email' => 'member@library.com'],
            [
                'name'     => 'Jane Member',
                'password' => Hash::make('Member@1234'),
                'type'     => 'member',
                'status'   => 'active',
            ]
        );

        // ── Categories ────────────────────────────────────
        $categories = ['Action', 'Romance', 'Thriller', 'Horror', 'Documentary'];
        $catMap = [];
        foreach ($categories as $name) {
            $cat = Category::firstOrCreate(['name' => $name]);
            $catMap[$name] = $cat->id;
        }

        // ── Sample Books ──────────────────────────────────
        $books = [
            ['The Dark Knight Returns',    'Frank Miller',       '9780930289454', 'Action',      'A dark tale of Batman coming out of retirement.'],
            ['Die Hard: The Novel',        'Roderick Thorp',     '9780393308600', 'Action',      'The book that inspired the legendary movie.'],
            ['Pride and Prejudice',        'Jane Austen',        '9780141439518', 'Romance',     'A timeless story of love and social standing in England.'],
            ['The Notebook',               'Nicholas Sparks',    '9780553816716', 'Romance',     'A moving story of love, loss, and memory.'],
            ['Gone Girl',                  'Gillian Flynn',      '9780307588371', 'Thriller',    'A gripping psychological thriller about a missing wife.'],
            ['The Girl with the Dragon Tattoo', 'Stieg Larsson', '9780307949486', 'Thriller',   'A journalist investigates a decades-old disappearance.'],
            ['It',                         'Stephen King',       '9781501142970', 'Horror',      'A terrifying story about a shape-shifting evil in Derry, Maine.'],
            ['The Haunting of Hill House', 'Shirley Jackson',    '9780143039983', 'Horror',      'Four people investigate the supernatural in an old mansion.'],
            ['A Brief History of Time',    'Stephen Hawking',    '9780553380163', 'Documentary', 'Hawking explains the nature of the universe in accessible terms.'],
            ['Sapiens',                    'Yuval Noah Harari',  '9780062316097', 'Documentary', 'A narrative of human history from the Stone Age to the present.'],
        ];

        foreach ($books as [$title, $author, $isbn, $cat, $desc]) {
            Book::firstOrCreate(
                ['isbn_no' => $isbn],
                [
                    'title'       => $title,
                    'author'      => $author,
                    'description' => $desc,
                    'category_id' => $catMap[$cat],
                    'image_path'  => null,
                ]
            );
        }
    }
}
