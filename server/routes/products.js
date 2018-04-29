import {Router} from 'express';
import middlewares from "@server/routes/middlewares";

const router = new Router();

router.get('/', middlewares.allProducts, async (req, res) => {
  const data = req.products,
    id = req.query.id;

  //patch: add "vote"
  // if (false) {
  //   console.log('Add vote to products...');
  //   const addVote = async ({id}) => {
  //     const {metafields} = await apiGet(`/admin/products/${id}/metafields.json`),
  //       metafield = search(metafields, 'vote');
  //     if (metafield) {
  //       await apiPut(`/admin/products/${id}/metafields/${metafield.id}.json`, {
  //         metafield: {
  //           value: JSON.stringify({
  //             vote5: rand(1, 3),
  //             vote4: rand(1, 3),
  //             vote3: 0,
  //             vote2: 0,
  //             vote1: 0
  //           })
  //         }
  //       });
  //       apiClear(`/admin/products/${id}/metafields.json`);
  //     }
  //   };
  //   const productTasks = chunk(data.products, 8);
  //   for (const tasks of productTasks) {
  //     await Promise.all(tasks.map(addVote));
  //   }
  //   console.log('completed');
  // }

  if (!id) res.json({products: data});
  else res.json(data.find(p => p.id * 1 === id * 1));
});

export default router;
