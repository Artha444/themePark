<?php

namespace App\Services;

use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        $this->configure();
    }

    public function configure(): void
    {
        Config::$serverKey = (string) config('services.midtrans.server_key');
        Config::$isProduction = (bool) config('services.midtrans.is_production', false);
        Config::$isSanitized = (bool) config('services.midtrans.is_sanitized', true);
        Config::$is3ds = (bool) config('services.midtrans.is_3ds', true);
    }

    /**
     * Create Snap Token for an Order.
     *
     * @param array{
     *     order_code: string,
     *     total_amount: int|float,
     *     customer_name: string,
     *     customer_email: string,
     *     customer_phone: string,
     *     items: array<int, array{id: string, price: int|float, quantity: int, name: string}>
     * } $orderData
     */
    public function createSnapToken(array $orderData): string
    {
        $this->configure();

        $itemDetails = [];
        $calculatedTotal = 0;

        foreach ($orderData['items'] as $item) {
            $price = (int) round($item['price']);
            $qty = (int) $item['quantity'];
            $calculatedTotal += ($price * $qty);

            $itemDetails[] = [
                'id' => (string) $item['id'],
                'price' => $price,
                'quantity' => $qty,
                'name' => mb_substr((string) $item['name'], 0, 50),
            ];
        }

        // Handle discount or difference if total_amount doesn't match sum of items
        $totalAmount = (int) round($orderData['total_amount']);
        $diff = $totalAmount - $calculatedTotal;
        if ($diff !== 0) {
            $itemDetails[] = [
                'id' => 'DISCOUNT-ADJ',
                'price' => $diff,
                'quantity' => 1,
                'name' => $diff < 0 ? 'Diskon Promo' : 'Penyesuaian Biaya',
            ];
        }

        $names = explode(' ', trim($orderData['customer_name']), 2);
        $firstName = $names[0] ?? 'Customer';
        $lastName = $names[1] ?? '';

        $params = [
            'transaction_details' => [
                'order_id' => $orderData['order_code'],
                'gross_amount' => $totalAmount,
            ],
            'customer_details' => [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $orderData['customer_email'],
                'phone' => $orderData['customer_phone'],
            ],
            'item_details' => $itemDetails,
        ];

        return Snap::getSnapToken($params);
    }
}
