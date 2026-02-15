package com.minepanel.bridge.serialization;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.Damageable;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.Map;

/**
 * Serializes Bukkit ItemStack objects into JSON for the panel API.
 */
public class ItemSerializer {

    /**
     * Serialize an ItemStack to a JSON object.
     *
     * @param stack The ItemStack (can be null)
     * @param slot  The slot index (-1 if not applicable)
     * @return JSON representation of the item
     */
    public static JsonObject serialize(ItemStack stack, int slot) {
        JsonObject json = new JsonObject();

        if (slot >= 0) {
            json.addProperty("slot", slot);
        }

        if (stack == null || stack.getType().isAir()) {
            json.addProperty("empty", true);
            return json;
        }

        json.addProperty("empty", false);
        json.addProperty("material", stack.getType().getKey().getKey());
        json.addProperty("amount", stack.getAmount());

        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            // Display name
            if (meta.hasDisplayName()) {
                json.addProperty("displayName", meta.getDisplayName());
            }

            // Lore
            if (meta.hasLore() && meta.getLore() != null) {
                JsonArray lore = new JsonArray();
                for (String line : meta.getLore()) {
                    lore.add(line);
                }
                json.add("lore", lore);
            }

            // Enchantments
            if (!meta.getEnchants().isEmpty()) {
                JsonObject enchants = new JsonObject();
                for (Map.Entry<Enchantment, Integer> entry : meta.getEnchants().entrySet()) {
                    enchants.addProperty(entry.getKey().getKey().getKey(), entry.getValue());
                }
                json.add("enchantments", enchants);
            }

            // Durability / Damage
            if (meta instanceof Damageable damageable) {
                json.addProperty("damage", damageable.getDamage());
                json.addProperty("maxDurability", stack.getType().getMaxDurability());
            }

            // Custom model data
            if (meta.hasCustomModelData()) {
                json.addProperty("customModelData", meta.getCustomModelData());
            }
        }

        return json;
    }
}
